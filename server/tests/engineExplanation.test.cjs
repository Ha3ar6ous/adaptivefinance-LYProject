const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm')
const {load,OUT}=require('../../engine_llm_audit/evaluate.cjs')
const e=load('server/services/investmentEngineService.js',['allocateRecommendations','largestRemainder'])
const ai=load('server/services/aiExplanationService.js',['validateExplanation','fallbackFromSnapshot','explanationFacts'])
const snapshot=JSON.parse(fs.readFileSync(path.join(OUT,'snapshots.json'),'utf8'))[0].snapshot
const candidate=(id,min,score=100)=>({optionId:id,minMonthlyAmount:min,score,expectedReturnPct:5,riskLevel:'low'})
test('largest remainder preserves rupees and percentage points with stable ties',()=>{
 assert.deepEqual(Array.from(e.largestRemainder(100,[1,1,1])),[34,33,33]);assert.deepEqual(Array.from(e.largestRemainder(7,[1,1,1])),[3,2,2])
})
test('infeasible products are dropped one at a time and full budget redistributed',()=>{
 const r=e.allocateRecommendations([candidate('a',500),candidate('b',500),candidate('c',500)],500)
 assert.equal(r.length,1);assert.equal(r[0].optionId,'a');assert.equal(r[0].allocationAmount,500);assert.equal(r[0].allocationPct,100)
})
test('allocation cannot fall below minimum or exceed budget',()=>{
 for(const budget of [1,99,499,500,501,1001,9999]){const r=e.allocateRecommendations([candidate('a',100),candidate('b',500,80),candidate('c',1000,70)],budget);for(const x of r)assert(x.allocationAmount>=x.minMonthlyAmount);if(r.length){assert.equal(r.reduce((s,x)=>s+x.allocationAmount,0),budget);assert.equal(r.reduce((s,x)=>s+x.allocationPct,0),100)}}
})
test('invalid budgets fail closed',()=>{for(const b of [0,-1,NaN,Infinity,1.5])assert.equal(e.allocateRecommendations([candidate('x',1)],b).length,0)})
test('schema-valid score999, invented product and wrong contextual number rejected',()=>{
 const base=JSON.parse(JSON.stringify(ai.fallbackFromSnapshot(snapshot)))
 for(const [key,text] of [['healthInsight','Your score is 999.'],['investmentInsight','Buy ImaginaryProduct.'],['healthInsight',`Score ${snapshot.forecast.total}.`]]){const bad=structuredClone(base);bad[key]=text;assert.throws(()=>ai.validateExplanation(bad,snapshot))}
})
test('typed facts exact, extra fields and changed decisions rejected',()=>{
 const good={templateId:'concise',facts:ai.explanationFacts(snapshot)};assert(ai.validateExplanation(good,snapshot).overview)
 assert.throws(()=>ai.validateExplanation({...good,extra:999},snapshot));assert.throws(()=>ai.validateExplanation({...good,facts:{...good.facts,healthScore:999}},snapshot));assert.throws(()=>ai.validateExplanation({...good,facts:{...good.facts,investmentEligible:!good.facts.investmentEligible}},snapshot))
})
test('full enumeration has zero measured allocation violations for every ranking',()=>{
 const rows=JSON.parse(fs.readFileSync(path.join(OUT,'engine_after.json'),'utf8'));for(const r of rows){assert.equal(r.min_violations,0);assert.equal(r.filter_violations,0);assert.equal(r.pct_violation,false);assert.equal(r.router_violation,false);assert(r.allocated<=r.budget);assert(r.n<=5)}assert.equal(rows.length,1728*3)
})
test('JSON transport pins model, schema mode and seed; timeout is observable',async()=>{
 const filename=path.resolve(__dirname,'../services/groqService.js'),module={exports:{}};let body
 vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module,process:{env:{GROQ_API_KEY:'dummy',GROQ_TIMEOUT_MS:'10',GROQ_MODEL:'ignored'}},AbortController,setTimeout,clearTimeout,fetch:async(_url,o)=>{body=JSON.parse(o.body);return {ok:true,json:async()=>({choices:[{message:{content:'{"templateId":"concise","facts":{}}'}}]})}}})
 await module.exports.callGroqJson({systemPrompt:'JSON',userPayload:{},seed:11});assert.equal(body.model,'openai/gpt-oss-20b');assert.equal(body.response_format.type,'json_object');assert.equal(body.seed,11)
 const timed={exports:{}};vm.runInNewContext(fs.readFileSync(filename,'utf8'),{module:timed,process:{env:{GROQ_API_KEY:'dummy',GROQ_TIMEOUT_MS:'5'}},AbortController,setTimeout,clearTimeout,fetch:async(_u,o)=>new Promise((_resolve,reject)=>o.signal.addEventListener('abort',()=>reject(Error('timeout'))))})
 await assert.rejects(timed.exports.callGroqJson({systemPrompt:'JSON',userPayload:{}}),/timeout/)
})
