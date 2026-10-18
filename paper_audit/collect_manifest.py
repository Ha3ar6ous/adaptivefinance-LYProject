"""Fingerprint public code/data evidence without reading credentials."""
import hashlib,json,platform,subprocess,sys
from pathlib import Path
R=Path(__file__).resolve().parents[1]
paths=sorted([*R.glob('data/**/*.csv'),*R.glob('paper_audit/*.py'),*R.glob('paper_audit/*.cjs'),
 R/'paper_audit/PROTOCOL.md',R/'server/services/decisionRouterService.js',R/'server/services/investmentEngineService.js',
 R/'server/controllers/investmentController.js',R/'server/package.json',R/'server/tests/routerSafety.test.cjs',
 R/'ml_service/modules/forecast.py',R/'ml_service/modules/volatility.py',R/'amend_test.md'])
out={'python':sys.version,'node':subprocess.check_output(['node','--version'],text=True).strip(),
 'os':platform.platform(),'base_commit':subprocess.check_output(['git','rev-parse','HEAD'],cwd=R,text=True).strip(),
 'sha256':{str(p.relative_to(R)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}}
(R/'paper_audit/final_manifest.json').write_text(json.dumps(out,indent=2),encoding='utf-8')
print('Fingerprint manifest written:',len(paths),'files')
