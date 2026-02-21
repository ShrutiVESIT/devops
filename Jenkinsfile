node {
    stage('Checkout') {
        checkout scm
    }
    stage('Frontend: install + build') {
        dir('frontend') {
            bat 'npm ci'
            bat 'npx vite build'
        }
    }
    stage('Backend: install + smoke test') {
        dir('backend') {
            bat '"C:\\Program Files\\Python314\\python.exe" --version'
            bat '"C:\\Program Files\\Python314\\python.exe" -m venv venv'
            bat 'call venv\\Scripts\\activate.bat && venv\\Scripts\\python.exe -m pip install -U pip && pip install -r requirements.txt && python -c "import fastapi; import uvicorn; print(\'Backend deps OK\')"'
        }
    }
    stage('Deploy (demo)') {
        echo 'Deploy step: build artifacts ready'
    }
}