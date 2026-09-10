// copycd:: HeliosenGltfpack CLI 런처
//
// 이 실행파일은 얇은 껍데기다. 실제 구현은 libHeliosenGltfpack.so 안에 있고,
// 여기서는 export 된 CallMain() 으로 인자를 그대로 넘기기만 한다.
//
// 주의. gltf 소스를 이 실행파일에 정적으로 링크하면 안 된다.
//       gltfpack.cpp 의 checkModuleName() 이 dladdr(&gltfMain) 으로 모듈 파일명을
//       확인하는데, 정적 링크하면 그 값이 실행파일 이름이 되어 "libHeliosenGltfpack"
//       과 불일치하고 "Error: invalid user." 로 죽는다.
//       .so 를 동적 링크해야 dladdr 이 .so 를 가리켜 검사를 통과한다.

#include <stdio.h>
#include <string.h>

#include "MyLibrary.h"

int main(int argc, char** argv)
{
	// 배포용이므로 평소에는 아무것도 찍지 않고 그대로 통과시킨다.
	// 로딩 확인이 필요할 때만 --selftest 로 확인한다.
	if (argc == 2 && strcmp(argv[1], "--selftest") == 0)
	{
		printf("%s\n", GetTestMessage());
		return 0;
	}

	return CallMain(argc, argv);
}
