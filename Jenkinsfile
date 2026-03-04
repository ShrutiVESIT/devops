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
            bat '"C:\\Python314\\python.exe" --version'
            bat '"C:\\Python314\\python.exe" -m venv venv'
            bat 'call venv\\Scripts\\activate.bat && venv\\Scripts\\python.exe -m pip install -U pip && pip install -r requirements.txt && python -c "import fastapi; import uvicorn; print(\'Backend deps OK\')"'
        }
    }

    stage('Deploy: start frontend dev server') {
        dir('frontend') {
            // Start Vite dev server in background so Selenium can access it
            bat 'start /B cmd /c "npx vite --host 0.0.0.0 > vite.log 2>&1"'
            // Wait a few seconds for the server to start
            bat 'ping -n 10 127.0.0.1 > nul'
        }
    }


    stage('UI Tests: Selenium + TestNG') {
        dir('ui-tests') {
            bat 'mvn clean test'
        }
    }

    stage('Publish Test Results') {
        junit '**/ui-tests/target/surefire-reports/*.xml'
    }

    stage('Cleanup') {
        // Kill the Vite dev server
        bat 'taskkill /F /IM node.exe /T || exit /b 0'
        echo 'Pipeline complete: build, deploy, and UI tests finished'
    }

}
