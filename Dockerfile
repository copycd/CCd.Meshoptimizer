# syntax=docker/dockerfile:1
#
# Heliosen gltfpack - Linux 이미지
#
# [빌드] 컨텍스트는 이 저장소 하나. basis_universal 은 별도 컨텍스트로 넘긴다.
#        (예전처럼 부모 폴더를 컨텍스트로 쓰면 D:\GitHub 전체가 딸려간다)
#   cd /mnt/d/GitHub/CCd.Meshoptimizer
#   docker build -t heliosen-gltfpack --build-context basisu=../CCd.basis_universal .
#
# [운영] 컨테이너를 상주시키고 exec 로 호출한다. 매 호출 docker run 은 쓰지 말 것.
#        컨테이너 생성 부하가 약 400ms 라, 계산시간(281KB 기준 약 280ms)보다 비싸다.
#        exec 는 약 17ms 라 사실상 무시할 수준이다.
#   docker run -d --name heliosen-gltfpack --restart unless-stopped \
#       -v /srv/models:/work heliosen-gltfpack
#   docker exec heliosen-gltfpack HeliosenGltfpack -i /work/in.glb -o /work/out.glb -c -tc
#
#   호스트 파일 소유권을 맞추려면 exec 에 --user 를 준다.
#   docker exec --user $(id -u):$(id -g) heliosen-gltfpack HeliosenGltfpack ...

# ---------- Stage 1: Build ----------
FROM ubuntu:22.04 AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
        cmake \
        g++ \
        make \
        libzstd-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY --from=basisu . /src/CCd.basis_universal/
COPY . /src/CCd.Meshoptimizer/

WORKDIR /src/CCd.Meshoptimizer
RUN cmake -B build \
        -DCMAKE_BUILD_TYPE=Release \
        -DMESHOPT_BUILD_CCd_LINUX=ON \
        -DMESHOPT_GLTFPACK_BASISU_PATH=/src/CCd.basis_universal \
        -DMESHOPT_INSTALL=OFF \
    && cmake --build build --parallel $(nproc)
# POST_BUILD 로 dist/linux-x64 에 실행파일과 .so 가 함께 복사된다.

# ---------- Stage 2: Runtime ----------
FROM ubuntu:22.04 AS runtime

# 주의. ubuntu 베이스 이미지에는 libstdc++6 가 없다. 설치하지 않으면 실행 못 한다.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libstdc++6 \
        libzstd1 \
    && rm -rf /var/lib/apt/lists/*

# 실행파일과 .so 를 같은 폴더에 둔다. rpath 가 $ORIGIN 이라 이 배치로 그냥 동작한다.
# /usr/local/bin 심볼릭 링크로 실행해도 $ORIGIN 은 실제 위치를 가리키므로 문제없다.
COPY --from=builder /src/CCd.Meshoptimizer/dist/linux-x64/ /opt/heliosen/gltfpack/
RUN ln -s /opt/heliosen/gltfpack/HeliosenGltfpack /usr/local/bin/HeliosenGltfpack \
    && HeliosenGltfpack --selftest

WORKDIR /work

# 상주용. 이름 잠금이 깨지면 위 --selftest 에서 빌드가 실패하므로 조기에 잡힌다.
CMD ["sleep", "infinity"]

LABEL org.opencontainers.image.description="Heliosen gltfpack (CLI + shared library) for Linux"
