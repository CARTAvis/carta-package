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
                    sh "source ~/emsdk/emsdk_env.sh"
                    sh "pwd"
                    sh "export PATH=/usr/local/bin:$PATH"
                    sh "wget http://alma.asiaa.sinica.edu.tw/_downloads/carta-backend-ICD-test-travis.tar.gz"
                    sh "tar -xvf carta-backend-ICD-test-travis.tar.gz"
                    sh "./run.sh & # run carta_backend in the background"
                    sh "cd carta-backend-ICD-test-travis"
                    sh "cd protobuf"
                    sh "git submodule init && git submodule update && git checkout master"
                    sh "npm install"
                    sh "./build_proto.sh"
                    sh "cd .."
                    sh "ls src/test/"
                    sh "./run-circle.sh"
                 echo "Finished !!"
            }
        }
    }
}
