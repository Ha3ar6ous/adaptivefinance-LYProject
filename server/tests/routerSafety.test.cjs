const test=require('node:test'),assert=require('node:assert/strict')
const {buildDecisionRouter}=require('../services/decisionRouterService')
const {buildInvestmentSuggestion}=require('../services/investmentEngineService')
const {calculateHealthScore}=require('../services/healthScoreService')
const {fixture,grid,invalidCases,allowed}=require('../../paper_audit/router_cases.cjs')
test('all conservative threshold combinations match independent policy oracle',()=>{
  for(const row of grid())assert.equal(allowed(buildDecisionRouter(row.input)),row.expected,row.name)
})
test('all malformed/missing analytics and financial cases fail closed without throwing',()=>{
  for(const row of invalidCases())assert.equal(allowed(buildDecisionRouter(row.input)),false,row.name)
})
test('missing or malformed entire request fails closed',()=>{
  for(const input of [undefined,null,[],true,42,''])assert.equal(allowed(buildDecisionRouter(input)),false)
})
test('exact liquidity, debt and health equality boundaries are accepted',()=>{
  assert.equal(allowed(buildDecisionRouter(fixture({liquidity:3,debt:.5,score:70,volatility:'medium'}))),true)
})
test('ready cached and fresh analytics both accepted',()=>{
  const f=fixture();f.analytics.status='ready';f.analytics.error=''
  assert.equal(allowed(buildDecisionRouter(f)),true)
  delete f.analytics.status;assert.equal(allowed(buildDecisionRouter(f)),true)
})
test('ML service failure is closed even with formerly sufficient score',()=>{
  const f=fixture({score:74});f.analytics={volatility:{label:'unknown'},forecast:{points:[],method:'error'}}
  assert.equal(allowed(buildDecisionRouter(f)),false)
})
function engineInput(f){return {userId:'audit-user',user:f.user,entries:Array.from({length:30},(_,i)=>({date:new Date(Date.UTC(2024,0,1+i)),income:1000})),analytics:{...f.analytics,health:f.health,router:{actions:[{key:'conservative_investing',allowed:true}]}}}}
test('investment engine revalidates stale/forged allowed flag',()=>{
  for(const row of [...grid(),...invalidCases()].filter(x=>!x.expected)){
    const result=buildInvestmentSuggestion(engineInput(row.input))
    assert.equal(result.eligible,false,row.name);assert.equal(result.suggestions.length,0,row.name)
  }
})
test('valid safe users still obtain recommendations',()=>{
  const r=buildInvestmentSuggestion(engineInput(fixture()))
  assert.equal(r.eligible,true);assert.equal(r.suggestions.length,5)
})
test('sub-rupee boundaries preserve strict inequalities',()=>{
  const f=fixture({liquidity:3,debt:.5,score:70})
  f.user.bankBalance-=.01;assert.equal(allowed(buildDecisionRouter(f)),false)
  f.user.bankBalance+=.01;f.user.debts+=.01;assert.equal(allowed(buildDecisionRouter(f)),false)
})
test('real Python outputs and health scorer remain compatible with router/engine',()=>{
  const fixtures=require(process.env.ROUTER_INTEGRATION_FIXTURES
    ? require('node:path').resolve(process.env.ROUTER_INTEGRATION_FIXTURES)
    : '../../paper_audit/integration_fixtures.json')
  for(const f of fixtures){
    const {user}=fixture();const health=calculateHealthScore({user,...f})
    const expected=health.score>=70&&['low','medium'].includes(f.analytics.volatility.label)
      &&f.analytics.volatility.features.recentAverageIncome>0
    const router=buildDecisionRouter({user,health,analytics:f.analytics})
    assert.equal(allowed(router),expected,f.name)
    const result=buildInvestmentSuggestion({userId:'audit',user,entries:f.entries,analytics:{...f.analytics,health,router}})
    if(!expected)assert.equal(result.eligible,false,f.name)
    if(f.name==='constant')assert.equal(result.eligible,true)
  }
})
test('read endpoint rebuilds recommendations from current profile instead of stored permission',async()=>{
  const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module')
  const f=fixture({debt:3});const input=engineInput(f);const dbReads=[]
  const chain=(name,value)=>({sort(){return this},lean:async()=>{dbReads.push(name);return value}})
  const models={
    '../models/User':{findById:()=>chain('user',input.user)},
    '../models/DailyIncomeEntry':{find:()=>chain('entries',input.entries)},
    '../models/IncomeAnalytics':{findOne:()=>chain('analytics',input.analytics)},
    '../models/InvestmentSuggestion':{findOne(){throw new Error('must not trust cached suggestion')},findOneAndUpdate(){throw new Error('GET must not write')}},
  }
  function load(filename,mocks){const module={exports:{}},req=createRequire(filename);vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,exports:module.exports,require:n=>n in mocks?mocks[n]:req(n),console,Date},{filename});return module.exports}
  const service=load(path.resolve(__dirname,'../services/investmentEngineService.js'),models)
  const controller=load(path.resolve(__dirname,'../controllers/investmentController.js'),{'../services/investmentEngineService':service})
  let response;await controller.getMyInvestmentSuggestion({user:{id:'audit'}},{json:x=>{response=x},status:()=>{throw new Error('unexpected HTTP failure')}})
  assert.equal(response.investment.eligible,false);assert.equal(response.investment.suggestions.length,0)
  assert.deepEqual(dbReads.sort(),['analytics','entries','user'])
})
