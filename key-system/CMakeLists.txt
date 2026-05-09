cmake_minimum_required(VERSION 3.10)
project(ScriptoraKeySystem)

set(CMAKE_CXX_STANDARD 17)

# Find dependencies
find_package(CURL REQUIRED)
find_package(OpenSSL REQUIRED)

# Include directories
include_directories(${CURL_INCLUDE_DIRS} ${OPENSSL_INCLUDE_DIR})

# Add executable
add_executable(ScriptoraGuard main.cpp ScriptoraGuard.cpp)

# Link libraries
target_link_libraries(ScriptoraGuard ${CURL_LIBRARIES} ${OPENSSL_LIBRARIES})
