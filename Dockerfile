# Stage 1: Build
FROM ubuntu:22.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    cmake \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN cmake -B build \
        -DCMAKE_BUILD_TYPE=Release \
        -DMESHOPT_BUILD_CCd_LINUX=ON \
        -DMESHOPT_INSTALL=OFF \
    && cmake --build build --parallel $(nproc)

# Stage 2: Runtime image (minimal)
FROM ubuntu:22.04 AS runtime

COPY --from=builder /app/build/libCCdMeshOptimizer.so /usr/local/lib/
RUN ldconfig

LABEL org.opencontainers.image.description="CCd.MeshOptimizer Linux shared library"
