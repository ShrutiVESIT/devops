pipeline {
    agent any

    tools {
        nodejs 'NodeJS-LTS'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend: install + build') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    bat 'npx vite build'
                }
            }
        }

        stage('Backend: install + smoke test') {
            steps {
                dir('backend') {
                    bat '''
                        "C:\\Program Files\\Python314\\python.exe" --version && ^
                        "C:\\Program Files\\Python314\\python.exe" -m venv venv && ^
                        call venv\\Scripts\\activate.bat && ^
                        pip install -U pip && ^
                        pip install -r requirements.txt && ^
                        python -c "import fastapi; import uvicorn; print('Backend deps OK')"
                    '''
                }
            }
        }

        stage('Deploy (demo)') {
            steps {
                echo 'Deploy step: build artifacts ready'
            }
        }
    }
}