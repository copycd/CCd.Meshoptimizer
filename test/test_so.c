// test_so.c
#include <stdio.h>

extern const char* GetTestMessage();
extern int CallMain(int argc, char** argv);

int main(int argc, char** argv) {
    printf("%s\n", GetTestMessage());
    return CallMain(argc, argv);
}