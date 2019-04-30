pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                sh "cp -r ../carta-backend/* ."
                sh "cp -r ../cmake-command.sh ."
                sh "export PATH=/usr/local/bin:$PATH"
                sh "git submodule init && git submodule update"
                dir ('build') {
                 sh "pwd"
                 sh "cp ../../cmake-command.sh ."
                 sh "pwd"
                 sh "./cmake-command.sh"
                 sh "make"
                }
            }
        }
        stage('ICD tests') {
            steps {
                echo 'Testing..'
                    sh "pwd"
                    sh "export PATH=/usr/local/bin:$PATH"
                    dir ('build') {
                      sh "cp -r ../../carta-backend-ICD-test-travis ."
                      sh "cp ../../run.sh ."
                      sh "./run.sh # run carta_backend in the background"
                      sh "lsof -i :3002"
                      sh "ls -sort"
                      sh "pwd"
                      dir ('carta-backend-ICD-test-travis') {
                        sh "ls -sort"
                        sh "pwd"
                        sh "ls src/test/"
                        sh "source ~/emsdk/emsdk_env.sh && npm install && ./run-circle.sh"
                      }
                   }
                 echo "Finished !!"
            }
        }
    }
}
