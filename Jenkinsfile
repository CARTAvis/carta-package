pipeline {
    agent any
        stages {
            stage('Build') {
                steps {
                    echo 'Build Stage'
                    pwd
                    git clone https://github.com/CARTAvis/carta-backend.git
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
            stage('ICD tests') {
                steps {
                    echo 'ICD test stage'
                    pwd
                    source ~/emsdk/emsdk_env.sh
                    wget http://alma.asiaa.sinica.edu.tw/_downloads/carta-backend-ICD-test-travis.tar.gz
                    tar -xvf carta-backend-ICD-test-travis.tar.gz
                    sed -i '' 's/carta_backend/carta_backend base=$PWD\/carta-backend-ICD-test-travis/g' run.sh
                    ./run.sh & # run carta_backend in the background
                    cd carta-backend-ICD-test-travis
                    cd protobuf
                    git submodule init
                    git submodule update
                    git checkout master
                    npm install
                    ./build_proto.sh
                    cd ..
                    ls src/test/
                    ./run-circle.sh
                    echo "Finished !!"
                }
            }
        }
    }
