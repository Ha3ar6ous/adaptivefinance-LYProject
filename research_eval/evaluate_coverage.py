"""stdlib line tracing of Python unit tests only (after module imports)."""
import contextlib, io, json, sys, trace, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'research_eval'))
from evaluate_python import CoreTests
tracer=trace.Trace(count=True,trace=False)
suite=unittest.defaultTestLoader.loadTestsFromTestCase(CoreTests)
with contextlib.redirect_stderr(io.StringIO()):
    result=tracer.runfunc(unittest.TextTestRunner(stream=io.StringIO()).run,suite)
counts=tracer.results().counts;out={}
for rel in ['ml_service/modules/forecast.py','ml_service/modules/volatility.py']:
    p=ROOT/rel;executable={line for line in trace._find_executable_linenos(str(p)) if line>0};hit={line for (filename,line),n in counts.items() if Path(filename).resolve()==p.resolve() and n>0}&executable
    out[rel]={'executable_lines':len(executable),'covered_lines':len(hit),'line_coverage_pct':100*len(hit)/len(executable),'uncovered_lines':sorted(executable-hit)}
total=sum(x['executable_lines'] for x in out.values());covered=sum(x['covered_lines'] for x in out.values())
out['combined']={'executable_lines':total,'covered_lines':covered,'line_coverage_pct':100*covered/total};out['test_summary']={'total':result.testsRun,'failed':len(result.failures),'errors':len(result.errors)}
(ROOT/'research_eval/coverage_results.json').write_text(json.dumps(out,indent=2),encoding='utf-8');print(json.dumps(out,indent=2))
