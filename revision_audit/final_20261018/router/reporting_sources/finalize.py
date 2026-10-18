"""Archive reporting sources/log and check final preservation, without overwrites."""
import argparse
import json
import shutil

import simulate as s


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--out',required=True)
    args=parser.parse_args();out=(s.ROOT/args.out).resolve()
    support=out/'reporting_sources';support.mkdir(exist_ok=False)
    for name in ('report.py','test_results.py','finalize.py'):
        shutil.copy2(s.ROOT/'router_sim'/name,support/name)
    shutil.copy2(s.ROOT/'CHANGES_router.md',support/'CHANGES_router.md')
    old=json.loads((out/'preserved_sha256.json').read_text())
    changed=[name for name,h in old.items() if not (s.ROOT/name).exists() or s.sha(s.ROOT/name)!=h]
    s.dump(support/'final_preservation.json',dict(files_checked=len(old),changed=changed))
    assert not changed,changed
    s.dump(out/'completion_sha256.json',{str(p.relative_to(out)).replace('\\','/'):s.sha(p) for p in out.rglob('*') if p.is_file()})
    print('Final source/report snapshots and preservation check saved; files unchanged:',len(old))
