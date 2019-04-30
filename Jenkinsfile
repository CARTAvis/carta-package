pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                sh "cp -r ../carta-backend/* ."
                sh "export PATH=/usr/local/bin:$PATH"
                sh "git submodule init && git submodule update"
                sh "mkdir build && cd build"
                sh "cmake -DCMAKE_CXX_FLAGS="-I /usr/local/opt/openssl/include -I /usr/local/include" -DCMAKE_CXX_STANDARD_LIBRARIES="-L /usr/local/Cellar/fmt/5.3.0/lib -L /usr/local/Cellar/hdf5/1.10.5/lib -L /usr/local/lib -L /usr/local/opt/openssl/lib" .."
                sh "make"
            }
        }
        stage('ICD tests') {
            steps {
                echo 'Testing..'
                    sh "source ~/emsdk/emsdk_env.sh"
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
