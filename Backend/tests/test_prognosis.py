from tests.base_case import BaseCase


class PrognosisTest(BaseCase):

    def test_successful_prognosis_fetch(self):
        # When
        response = self.app.get('/cases-risklayer/prognosis', headers={"Content-Type": "application/json"})

        # Then
        self.assertEqual(float, type(response.json['prognosis']))
        self.assertEqual(str, type(response.json['timestamp']))
        self.assertEqual(200, response.status_code)
