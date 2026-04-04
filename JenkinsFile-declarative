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
            bat '"C:\\Python314\\python.exe" --version'
            bat '"C:\\Python314\\python.exe" -m venv venv'
            bat 'call venv\\Scripts\\activate.bat && venv\\Scripts\\python.exe -m pip install -U pip && pip install -r requirements.txt && python -c "import fastapi; import uvicorn; print(\'Backend deps OK\')"'
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
