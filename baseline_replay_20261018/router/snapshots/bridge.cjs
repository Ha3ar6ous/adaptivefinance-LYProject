// Read-only consistency checks against frozen application functions; no DB/API.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm')
const root=path.resolve(__dirname,'..')
const [mode,outPath,inputPath]=process.argv.slice(2)
if(mode==='options') {
  process.stdout.write(JSON.stringify(require(path.join(root,'server/data/investmentOptions')).loadInvestmentOptions()))
} else {
  const snap=path.resolve(outPath,'snapshots')
  const {calculateHealthScore}=require(path.join(snap,'health.js'))
  const revised=require(path.join(snap,'revised.js')).buildDecisionRouter
  const original=require(path.join(snap,'original.js')).buildDecisionRouter
  const context={module:{exports:{}},require:(p)=> {
    if(p==='../data/investmentOptions') return require(path.join(root,'server/data/investmentOptions'))
    if(p==='./decisionRouterService') return {buildDecisionRouter:revised}
    if(p.startsWith('../models/')) return {}
    throw Error(`Unexpected import ${p}`)
  }}
  vm.runInNewContext(fs.readFileSync(path.join(snap,'engine.js'),'utf8')+'\nmodule.exports.audit={deriveInputs};',context)
  const rows=JSON.parse(fs.readFileSync(inputPath,'utf8'))
  const allowed=(r)=>r.actions.find(a=>a.key==='conservative_investing').allowed
  const output=rows.map(row=> {
    const health=calculateHealthScore(row)
    const payload={...row,health}
    return {health:health.score,phase:health.phase,original:allowed(original(payload)),revised:allowed(revised(payload)),budget:context.module.exports.audit.deriveInputs(payload).investableAmount}
  })
  process.stdout.write(JSON.stringify(output))
}
