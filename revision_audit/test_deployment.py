import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('runtime_volatility_revision', ROOT/'ml_service/modules/volatility.py')
v = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v)


class DeploymentTests(unittest.TestCase):
    def test_pinned_thresholds(self):
        self.assertEqual(v._load_thresholds(), dict(low_max_cv=.45, medium_max_cv=.75))

    def test_boundaries(self):
        for cv, expected in [(.449, 'low'), (.45, 'medium'), (.451, 'medium'),
                             (.749, 'medium'), (.75, 'high'), (.751, 'high')]:
            self.assertEqual(v._label_from_cv(cv), expected)
            # Centered arithmetic avoids 100*(1-.45) creating55.00000000000001.
            r=v.classify_volatility([dict(income=100-100*cv),dict(income=100),dict(income=100+100*cv)])
            self.assertEqual(r['label'], expected)

    def test_legacy_artifact_cannot_override_validated_deployment(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'thresholds.json';path.write_text('{"low_max_cv":0.1,"medium_max_cv":0.2}')
            with patch.object(v,'ARTIFACT_PATH',path):
                self.assertEqual(v._load_thresholds()['low_max_cv'],.45)
                self.assertEqual(v._load_thresholds()['medium_max_cv'],.75)

    def test_high_boundary_unchanged(self):
        for cv in [.35,.4,.449,.45,.5,.749,.75,.9]:
            self.assertEqual(v._label_from_cv(cv)=='high',cv>=.75)


if __name__=='__main__':unittest.main()
