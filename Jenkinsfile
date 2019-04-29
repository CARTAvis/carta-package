pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                echo 'Building..'
                    pwd
                    git clone "https://github.com/CARTAvis/carta-backend.git"
                    cd carta-backend
                    git submodule init
                    git submodule update
                    mkdir build
                    cd build
                    cmake -DCMAKE_CXX_FLAGS="-I /usr/local/opt/openssl/include -I /usr/local/include" -DCMAKE_CXX_STANDARD_LIBRARIES="-L /usr/local/Cellar/fmt/5.3.0/lib -L /usr/local/Cellar/hdf5/1.10.5/lib -L /usr/local/lib -L /usr/local/opt/openssl/lib" ..
                    make
                    ls -sort
            }
        }
        stage('Test') {
            steps {
                echo 'Testing..'
            }
        }
        stage('Deploy') {
            steps {
                echo 'Deploying....'
            }
        }
    }
}
