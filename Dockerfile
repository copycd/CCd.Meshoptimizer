# Build context: parent directory (D:\GitHub\)
# docker build -t ccd-meshoptimizer -f CCd.Meshoptimizer/Dockerfile .

# Stage 1: Build
FROM ubuntu:22.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    g++ \
    make \
    libzstd-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY CCd.Meshoptimizer/ ./CCd.Meshoptimizer/
COPY CCd.basis_universal/ ./CCd.basis_universal/

WORKDIR /src/CCd.Meshoptimizer
RUN cmake -B build \
        -DCMAKE_BUILD_TYPE=Release \
        -DMESHOPT_BUILD_CCd_LINUX=ON \
        -DMESHOPT_GLTFPACK_BASISU_PATH=/src/CCd.basis_universal \
        -DMESHOPT_INSTALL=OFF \
    && cmake --build build --parallel $(nproc)

# Stage 2: Runtime image (minimal)
FROM ubuntu:22.04 AS runtime

COPY --from=builder /src/CCd.Meshoptimizer/build/libCCdMeshOptimizer.so /usr/local/lib/
RUN ldconfig

LABEL org.opencontainers.image.description="CCd.MeshOptimizer Linux shared library with BasisU"
