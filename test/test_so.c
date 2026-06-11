// test_so.c
#include <stdio.h>

extern const char* GetTestMessage();
extern int CallMain(int argc, char** argv);

int main() {
    printf("%s\n", GetTestMessage());

    char* args[] = { "gltfpack", "-h", NULL };
    return CallMain(2, args);
}