node {
    stage('Checkout') {
        git url: 'https://github.com/ShrutiVESIT/devops', branch: 'master'
    }

    stage('Frontend: install + build') {
        dir('frontend') {
            bat 'npm ci'
            bat 'npx vite build'
        }
    }

    stage('Backend: install + smoke test') {
        dir('backend') {
            bat '''
            python -m venv venv
            venv\\Scripts\\python -m pip install -U pip
            venv\\Scripts\\pip install -r requirements.txt
            venv\\Scripts\\python -c "import fastapi; import uvicorn; print('Backend deps OK')"
            '''
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
        bat 'dir'
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
