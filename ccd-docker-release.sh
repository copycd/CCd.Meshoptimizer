#!/usr/bin/env bash
#
# copycd:: Heliosen gltfpack - Docker 이미지 만들기 + 고객 배포용 tar 뽑기 (원클릭)
#
# Windows 에서는 BUILD_DOCKER.bat 을 더블클릭하면 WSL 안에서 이 스크립트가 돌아간다.
# WSL/리눅스 셸에서 직접 실행해도 동일하게 동작한다.
#
#   STEP 1  필수 도구/경로 확인   docker 데몬, basis_universal
#   STEP 2  docker build          컨텍스트는 이 저장소 하나, basisu 는 named context
#   STEP 3  이미지 스모크 테스트   --selftest + 실제 변환 1회
#   STEP 4  docker save           dist/docker/heliosen-gltfpack-<태그>.tar
#   STEP 5  고객 안내문 + 체크섬   같은 폴더에 INSTALL.txt, SHA256SUMS
#
# 옵션
#   --tag NAME      이미지 태그 (기본: 오늘 날짜 YYYY.MM.DD)
#   --basisu PATH   basis_universal 경로 (기본: ../CCd.basis_universal)
#   --platform P    linux/amd64 (기본) 또는 linux/arm64
#   --no-save       이미지만 만들고 tar 는 뽑지 않음
#   --no-cache      캐시 무시하고 처음부터 빌드
#   -h, --help
#
# 왜 이렇게 하는가 (전부 한 번씩 물려본 것들이다)
#   - 고객에게 Dockerfile 을 주면 안 된다. 소스 전체와 cmake/g++ 이 있어야 빌드되고,
#     무엇보다 소스가 고객 장비로 나간다. 이미지를 만들어서 이미지(tar)를 준다.
#   - 컨텍스트를 부모 폴더로 잡으면 D:\GitHub 전체가 tar 로 말린다. 그래서 컨텍스트는
#     이 저장소 하나이고 basis_universal 은 --build-context 로 따로 넘긴다.
#   - :latest 만 주면 고객이 어느 버전을 깔았는지 추적이 안 된다. 날짜 태그를 같이 단다.
#   - 이미지 레이어는 이미 압축돼 있다. tar 를 gzip 해도 29.5MB -> 29.2MB 라 의미 없다.
#   - 빌드를 ubuntu 22.04 에서 하는 이유: WSL(24.04)에서 직접 빌드한 바이너리는
#     glibc 2.38 을 요구해서 ubuntu 22.04 / debian 12 에서 실행되지 않는다.

set -uo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SRC" || exit 1
LOG="$SRC/ccd-docker-release.log"
exec > >(tee "$LOG") 2>&1

IMAGE="heliosen-gltfpack"
TAG="$(date +%Y.%m.%d)"
BASISU="$SRC/../CCd.basis_universal"
PLATFORM="linux/amd64"
DO_SAVE=1
NOCACHE=""

step() { printf '\n=== STEP %s  %s ===\n' "$1" "$2"; }
say()  { printf '%s\n' "$*"; }
die()  { printf '\n[ERROR] %s\n' "$*"; exit 1; }

while [ $# -gt 0 ]; do
    case "$1" in
        --tag)      TAG="${2:-}";      shift 2 ;;
        --basisu)   BASISU="${2:-}";   shift 2 ;;
        --platform) PLATFORM="${2:-}"; shift 2 ;;
        --no-save)  DO_SAVE=0;         shift ;;
        --no-cache) NOCACHE="--no-cache"; shift ;;
        -h|--help)
            awk 'NR>1 && /^#/ { sub(/^# ?/, ""); print; next } NR>1 { exit }' "$0"
            exit 0 ;;
        *) die "모르는 옵션: $1   (--help 참고)" ;;
    esac
done

step 1 "필수 도구/경로 확인"
command -v docker >/dev/null 2>&1 || die "docker 를 찾을 수 없다. Windows 라면 Docker Desktop 이 켜져 있는지 확인할 것."
docker version >/dev/null 2>&1     || die "docker 데몬에 연결할 수 없다. Docker Desktop 을 켜거나 dockerd 를 시작할 것."
[ -f "$SRC/Dockerfile" ]           || die "Dockerfile 이 없다: $SRC"
[ -d "$BASISU" ]                   || die "basis_universal 을 찾을 수 없다: $BASISU   (--basisu 로 지정 가능)"
BASISU="$(cd "$BASISU" && pwd)"
say "  docker    : $(docker version --format '{{.Server.Version}}')"
say "  basisu    : $BASISU"
say "  이미지    : $IMAGE:$TAG   ($PLATFORM)"

step 2 "docker build"
docker build $NOCACHE \
    --platform "$PLATFORM" \
    -t "$IMAGE:$TAG" -t "$IMAGE:latest" \
    --build-context "basisu=$BASISU" \
    -f "$SRC/Dockerfile" "$SRC" || die "docker build 실패"

step 3 "이미지 스모크 테스트"
docker run --rm "$IMAGE:$TAG" HeliosenGltfpack --selftest \
    || die "--selftest 실패. 이름 잠금이 깨졌거나 .so 를 못 물고 있다."
if [ -f "$SRC/test/data/tree.glb" ]; then
    docker run --rm -v "$SRC/test/data:/in:ro" "$IMAGE:$TAG" \
        HeliosenGltfpack -i /in/tree.glb -o /tmp/out.glb -c -tc >/dev/null \
        || die "실제 변환 실패"
    say "  실제 변환 1회 통과 (tree.glb)"
else
    say "  [WARN] test/data/tree.glb 이 없어 변환 테스트는 건너뛴다."
fi

OUTDIR="$SRC/dist/docker"
TARBALL="$OUTDIR/$IMAGE-$TAG.tar"

if [ "$DO_SAVE" -eq 0 ]; then
    step 4 "docker save 생략 (--no-save)"
    say "  이미지만 만들었다: $IMAGE:$TAG"
    exit 0
fi

step 4 "docker save"
mkdir -p "$OUTDIR"
rm -f "$TARBALL"
docker save "$IMAGE:$TAG" -o "$TARBALL" || die "docker save 실패"
say "  $TARBALL   ($(du -h "$TARBALL" | cut -f1))"

step 5 "고객 안내문 + 체크섬"
cat > "$OUTDIR/INSTALL.txt" <<TXT
Heliosen gltfpack   ($IMAGE:$TAG, $PLATFORM)

[필요한 것]
  docker 하나면 된다. 소스도 컴파일러도 인터넷 연결도 필요 없다.
  CPU 아키텍처가 $PLATFORM 이어야 한다. (ARM 서버에서는 동작하지 않는다)

[1. 이미지 적재]
  docker load -i $(basename "$TARBALL")

[2. 컨테이너 상주 기동]
  docker run -d --name heliosen-gltfpack --restart unless-stopped -v /srv/models:/work $IMAGE:$TAG

  -v 왼쪽(/srv/models)은 실제 모델 파일이 있는 호스트 경로로 바꿔서 쓴다.

[3. 호출]
  docker exec heliosen-gltfpack HeliosenGltfpack -i /work/in.glb -o /work/out.glb -c -tc

  결과 파일 소유권을 호스트 사용자로 맞추려면 --user 를 준다.
  (안 주면 결과물이 root 소유로 생긴다)
  docker exec --user \$(id -u):\$(id -g) heliosen-gltfpack HeliosenGltfpack -i /work/in.glb -o /work/out.glb -c -tc

[중요] 매 호출마다 docker run 을 쓰지 말 것.
  컨테이너를 새로 만드는 데만 약 400ms 가 든다. 변환 자체가 약 280ms 이므로
  배보다 배꼽이 커진다. 위처럼 컨테이너를 한 번 띄워두고 exec 로 호출하면
  추가 부하가 약 17ms 로 떨어진다. 계산 성능 자체는 네이티브와 동일하다.

[동작 확인]
  docker exec heliosen-gltfpack HeliosenGltfpack --selftest
  -> "Hello(안녕) from native DLL!" 이 나오면 정상

[무결성 확인]
  sha256sum -c SHA256SUMS
TXT
( cd "$OUTDIR" && sha256sum "$(basename "$TARBALL")" > SHA256SUMS )
say "  $OUTDIR/INSTALL.txt"
say "  $OUTDIR/SHA256SUMS"

printf '\n================================================================\n'
printf '  완료.  고객에게 보낼 것은 이 폴더 3개 파일이다.\n'
printf '    %s\n' "$OUTDIR"
ls -1 "$OUTDIR"
printf '================================================================\n'
