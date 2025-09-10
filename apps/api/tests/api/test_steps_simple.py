"""
Simple integration tests for the steps endpoint focusing on validation
"""
import datetime

import pytest
from fastapi.testclient import TestClient

from src.main import app
from src.security.api_token import verify_api_key


@pytest.fixture
def client():
    """Create a test client with mocked authentication"""
    # Override the dependency to skip authentication
    def mock_verify_api_key():
        return "test-api-key"

    app.dependency_overrides[verify_api_key] = mock_verify_api_key

    client = TestClient(app)
    yield client

    # Clean up the override
    app.dependency_overrides.clear()


def test_get_steps_missing_required_params(client):
    """Test validation when required parameters are missing"""
    response = client.get("/steps")
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    # Should complain about missing user_id, date_from, date_to
    assert len(data["detail"]) >= 3


def test_get_steps_invalid_aggregation_type(client):
    """Test validation of invalid aggregation type"""
    response = client.get(
        "/steps",
        params={
            "user_id": "test-user",
            "date_from": "2024-01-01T00:00:00",
            "date_to": "2024-01-01T23:59:59",
            "aggregation": "invalid_type"
        }
    )
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data


def test_get_steps_invalid_timezone(client):
    """Test validation of invalid timezone"""
    response = client.get(
        "/steps",
        params={
            "user_id": "test-user",
            "date_from": "2024-01-01T00:00:00",
            "date_to": "2024-01-01T23:59:59",
            "timezone": "Invalid/Timezone"
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "Invalid timezone" in data["detail"]


def test_get_steps_date_validation_error(client):
    """Test validation when date_from is after date_to"""
    response = client.get(
        "/steps",
        params={
            "user_id": "test-user",
            "date_from": "2024-01-02T00:00:00",
            "date_to": "2024-01-01T23:59:59"  # Earlier than date_from
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "date_from must be before date_to" in data["detail"]


def test_get_steps_too_far_in_past(client):
    """Test validation when date is too far in the past"""
    old_year = datetime.datetime.now().year - 2
    response = client.get(
        "/steps",
        params={
            "user_id": "test-user",
            "date_from": f"{old_year}-01-01T00:00:00",
            "date_to": f"{old_year}-01-01T23:59:59"
        }
    )
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data
    assert "cannot be more than 1 year in the past" in data["detail"]




def test_get_steps_response_structure_schema():
    """Test that response follows the expected schema structure"""
    # Verify that the response models are correctly defined
    from src.models.steps import GetStepsResponse, StepDataPoint

    # Test that the models can be instantiated
    step_point = StepDataPoint(
        created_at="2024-01-01T10:00:00+01:00",
        value=1500
    )
    assert step_point.created_at == "2024-01-01T10:00:00+01:00"
    assert step_point.value == 1500

    response = GetStepsResponse(data=[step_point], total_count=1)
    assert response.total_count == 1
    assert len(response.data) == 1
