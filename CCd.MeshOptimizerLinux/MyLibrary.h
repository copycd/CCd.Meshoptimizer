#pragma once

#ifdef _WIN32
  #ifdef MYLIBRARY_EXPORTS
    #define MYLIB_API __declspec(dllexport)
  #else
    #define MYLIB_API __declspec(dllimport)
  #endif
#else
  #define MYLIB_API __attribute__((visibility("default")))
#endif

extern "C"
{
	MYLIB_API int CallMain(int argc, char** argv);
	MYLIB_API const char* GetTestMessage();
}
