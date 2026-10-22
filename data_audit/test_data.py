import json
import os
import unittest
import numpy as np
import pandas as pd
import run as s

R=s.ROOT/os.environ.get('DATA_AUDIT_RESULTS','data_audit/results_20261017')


class DataTests(unittest.TestCase):
    def test_seeded_generator_reproduces(self):
        d=s.synthetic(11,0);saved=pd.read_csv(R/'synthetic_seed11.csv')
        pd.testing.assert_frame_equal(d,saved,check_dtype=False)

    def test_unique_canonical_keys(self):
        d=pd.read_csv(R/'repository_canonical.csv');self.assertFalse(d.duplicated(['platform','date']).any())
        self.assertEqual(d.platform.nunique(),5)

    def test_new_generator_keys_and_incentives(self):
        d=pd.concat([pd.read_csv(R/f'synthetic_seed{seed}.csv') for seed in [11,23,37,53,71]])
        self.assertEqual(len(d),4500);self.assertFalse(d.duplicated(['platform','date']).any())
        self.assertTrue((d.income>=0).all());self.assertTrue((d.loc[(~d.worked)|d.outage,'income']==0).all())
        self.assertTrue((pd.to_datetime(d.loc[d.incentive>0,'date']).dt.weekday>=4).all())

    def test_real_daily_derivative_no_location_columns(self):
        d=pd.read_csv(R/'real_uber_daily_USD_AGPL3.csv');self.assertEqual(set(d.columns),{'date','platform','income','recorded_trip_day'})
        self.assertTrue(pd.to_datetime(d.date).diff().dropna().eq(pd.Timedelta(days=1)).all())
        p=json.loads((R/'real_provenance.json').read_text());self.assertEqual(len(d),p['daily_rows'])
        self.assertEqual(int((~d.recorded_trip_day).sum()),p['zero_filled_unrecorded_days'])

    def test_currency_never_pooled(self):
        m=pd.read_csv(R/'forecast_metrics.csv')
        self.assertEqual(set(m[m.dataset=='real_single_driver'].currency),{'USD'})
        self.assertTrue((m[m.dataset!='real_single_driver'].currency=='INR').all())

    def test_forecast_origins_and_target_lengths(self):
        d=pd.read_csv(R/'forecast_windows.csv');inv=pd.read_csv(R/'series_split_inventory.csv').set_index(['dataset','series'])
        for row in d.itertuples():
            meta=inv.loc[(row.dataset,row.series)]
            self.assertGreaterEqual(row.origin,meta.test_start);self.assertLessEqual(row.origin+row.horizon,meta.n);self.assertEqual(row.n,row.horizon)

    def test_original_sources_preserved(self):
        p=json.loads((R/'preservation_check.json').read_text());self.assertEqual(p['changed'],[])
        for name,h in json.loads((R/'original_dataset_sha256.json').read_text()).items():self.assertEqual(s.helpers.sha(s.ROOT/name),h)


if __name__=='__main__':unittest.main()
