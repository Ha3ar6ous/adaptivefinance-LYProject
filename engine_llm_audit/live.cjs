// Synthetic snapshots only; key stays in process memory. No DB write.
const fs=require('node:fs'),path=require('node:path')
const {load,OUT,ROOT,write}=require('./evaluate.cjs')
require(path.join(ROOT,'server/node_modules/dotenv')).config({path:path.join(ROOT,'server/.env'),quiet:true})
const groq=require('../server/services/groqService')
const ai=load('server/services/aiExplanationService.js',['systemPrompt','validateExplanation','explanationFacts','fallbackFromSnapshot'])
const fixtures=JSON.parse(fs.readFileSync(path.join(OUT,'snapshots.json'),'utf8'))
async function main(){const smoke=process.argv.includes('--smoke'),rows=[];for(const [index,{seed,id,snapshot}] of (smoke?fixtures.slice(0,1):fixtures).entries()){
 const start=performance.now();let raw,error='',api=false,schema=false,faithful=false,fallback=true
 try{raw=await groq.callGroqJson({systemPrompt:ai.systemPrompt,userPayload:{snapshot,expectedFacts:ai.explanationFacts(snapshot)},seed});api=true
 schema=raw&&typeof raw.templateId==='string'&&raw.facts&&typeof raw.facts.healthScore==='number'&&typeof raw.facts.investmentEligible==='boolean'
 faithful=JSON.stringify(raw.facts)===JSON.stringify(ai.explanationFacts(snapshot)) // order-independent check below
 faithful=raw.facts&&Object.entries(ai.explanationFacts(snapshot)).every(([k,v])=>raw.facts[k]===v)
 ai.validateExplanation(raw,snapshot);fallback=false
 }catch(e){error=e.message;ai.fallbackFromSnapshot(snapshot,error)}
 rows.push({id,seed,api_success:api,schema_pass:Boolean(schema),facts_faithful:Boolean(faithful),fallback,latency_ms:performance.now()-start,error,raw})
 if(index%10===0)console.log(JSON.stringify({completed:index+1,total:smoke?1:fixtures.length,api_success:rows.filter(x=>x.api_success).length,fallbacks:rows.filter(x=>x.fallback).length}))
 if(!smoke&&index<fixtures.length-1)await new Promise(resolve=>setTimeout(resolve,2100))
 }
 write(smoke?'live_smoke.json':'live_125.json',{model:groq.JSON_MODEL,temperature:0,seeds:[11,23,37,53,71],timeout_ms:Number(process.env.GROQ_TIMEOUT_MS||12000),pacing_ms:2100,rows})
}
main().catch(e=>{console.error(e.message);process.exitCode=1})
