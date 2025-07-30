#pragma once

#pragma once

#ifdef MYLIBRARY_EXPORTS
#define MYLIB_API __declspec(dllexport)
#else
#define MYLIB_API __declspec(dllimport)
#endif

extern "C"
{
	MYLIB_API int CallMain(int argc, char** argv);

	// 문자열 반환 예시
	MYLIB_API const char* GetTestMessage();
}
