import pytest
import os
import zipfile
from pathlib import Path
from src.services.inspector import ProjectInspector


@pytest.fixture
def inspector():
    upload_dir = Path('/tmp/test_uploads')
    workspace_dir = Path('/tmp/test_workspaces')
    upload_dir.mkdir(parents=True, exist_ok=True)
    workspace_dir.mkdir(parents=True, exist_ok=True)
    return ProjectInspector(upload_dir, workspace_dir)


@pytest.fixture
def sample_zip():
    """Create a sample docker-compose project ZIP for testing."""
    zip_path = Path('/tmp/test_sample.zip')
    with zipfile.ZipFile(zip_path, 'w') as zf:
        # Add a docker-compose.yml
        compose_content = """
version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
"""
        zf.writestr('docker-compose.yml', compose_content)
    return zip_path


@pytest.mark.asyncio
async def test_inspect_valid_project(inspector, sample_zip):
    """Test inspection of a valid docker-compose project."""
    result = await inspector.inspect('test-project', str(sample_zip))

    assert result['is_valid'] is True
    assert 'detected_services' in result
    assert len(result['detected_services']) == 2
    assert result['detected_services'][0]['name'] in ['web', 'db']


@pytest.mark.asyncio
async def test_inspect_no_compose_file(inspector):
    """Test inspection fails when no docker-compose file is present."""
    # Create a ZIP without docker-compose
    zip_path = Path('/tmp/test_empty.zip')
    with zipfile.ZipFile(zip_path, 'w') as zf:
        zf.writestr('README.md', 'Test')

    with pytest.raises(ValueError, match="No docker-compose"):
        await inspector.inspect('test-project', str(zip_path))


def test_determine_service_type(inspector):
    """Test service type detection."""
    assert inspector._determine_service_type({'image': 'postgres:15'}) == 'database'
    assert inspector._determine_service_type({'image': 'redis:alpine'}) == 'cache'
    assert inspector._determine_service_type({'image': 'nginx:alpine'}) == 'proxy'
    assert inspector._determine_service_type({'image': 'node:18'}) == 'application'


def test_extract_dependencies(inspector):
    """Test dependency extraction."""
    compose_data = {
        'services': {
            'web': {
                'depends_on': ['db', 'cache']
            },
            'db': {},
            'cache': {}
        }
    }

    deps = inspector._extract_dependencies(compose_data)
    assert len(deps) == 2
    assert any(d['from'] == 'web' and d['to'] == 'db' for d in deps)
    assert any(d['from'] == 'web' and d['to'] == 'cache' for d in deps)
