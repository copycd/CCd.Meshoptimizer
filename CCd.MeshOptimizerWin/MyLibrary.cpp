#include "pch.h"
#include "MyLibrary.h"
#include "../gltf/gltfpack.h"

int CallMain(int argc, char** argv)
{
	return gltfMain(argc, argv);
}


const char* GetTestMessage()
{
	return "Hello(안녕) from native DLL!";
}
