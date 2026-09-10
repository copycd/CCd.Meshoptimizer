cmake_minimum_required(VERSION 3.5...3.30)

if(POLICY CMP0077)
    cmake_policy(SET CMP0077 NEW) # Enables override of options from parent CMakeLists.txt
endif()

if(POLICY CMP0091)
    cmake_policy(SET CMP0091 NEW) # Enables use of MSVC_RUNTIME_LIBRARY
endif()

if(POLICY CMP0092)
    cmake_policy(SET CMP0092 NEW) # Enables clean /W4 override for MSVC
endif()

project(meshoptimizer VERSION 1.2 LANGUAGES CXX)

option(MESHOPT_BUILD_DEMO "Build demo" OFF)
option(MESHOPT_BUILD_GLTFPACK "Build gltfpack" OFF)
option(MESHOPT_BUILD_SHARED_LIBS "Build shared libraries" OFF)
option(MESHOPT_STABLE_EXPORTS "Only export stable APIs from shared library" OFF)
option(MESHOPT_WERROR "Treat warnings as errors" OFF)
option(MESHOPT_INSTALL "Install library" ON)

# Optional gltfpack components for texture compression support
set(MESHOPT_GLTFPACK_BASISU_PATH "" CACHE STRING "") # Basis Universal, https://github.com/BinomialLLC/basis_universal
set(MESHOPT_GLTFPACK_LIBWEBP_PATH "" CACHE STRING "") # libwebp, https://github.com/webmproject/libwebp

set(SOURCES
    src/meshoptimizer.h
    src/allocator.cpp
    src/clusterizer.cpp
    src/indexanalyzer.cpp
    src/indexcodec.cpp
    src/indexgenerator.cpp
    src/meshletcodec.cpp
    src/meshletutils.cpp
    src/opacitymap.cpp
    src/overdrawoptimizer.cpp
    src/partition.cpp
    src/quantization.cpp
    src/rasterizer.cpp
    src/remesher.cpp
    src/simplifier.cpp
    src/spatialorder.cpp
    src/stripifier.cpp
    src/tangentspace.cpp
    src/vcacheoptimizer.cpp
    src/vertexcodec.cpp
    src/vertexfilter.cpp
    src/vfetchoptimizer.cpp
)

set(GLTF_SOURCES
    gltf/animation.cpp
    gltf/encodebasis.cpp
    gltf/encodewebp.cpp
    gltf/fileio.cpp
    gltf/gltfpack.cpp
    gltf/image.cpp
    gltf/json.cpp
    gltf/material.cpp
    gltf/mesh.cpp
    gltf/node.cpp
    gltf/parseobj.cpp
    gltf/parselib.cpp
    gltf/parsegltf.cpp
    gltf/stream.cpp
    gltf/write.cpp
)

if(WIN32)
    list(APPEND GLTF_SOURCES gltf/gltfpack.manifest)
endif()

if(MSVC)
    add_compile_options(/W4)
else()
    add_compile_options(-Wall -Wextra -Wshadow -Wno-missing-field-initializers)
endif()

if(MESHOPT_WERROR)
    if(MSVC)
        add_compile_options(/WX)
    else()
        add_compile_options(-Werror)
    endif()
endif()

if(MESHOPT_BUILD_SHARED_LIBS)
    add_library(meshoptimizer SHARED ${SOURCES})
else()
    add_library(meshoptimizer STATIC ${SOURCES})
endif()

target_include_directories(meshoptimizer INTERFACE "$<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/src>")

if(MESHOPT_BUILD_SHARED_LIBS)
    set_target_properties(meshoptimizer PROPERTIES CXX_VISIBILITY_PRESET hidden)
    set_target_properties(meshoptimizer PROPERTIES VISIBILITY_INLINES_HIDDEN ON)

    # soversion may be requested via -DMESHOPT_SOVERSION=n; note that experimental APIs (marked with MESHOPTIMIZER_EXPERIMENTAL) are not ABI-stable
    if(MESHOPT_SOVERSION)
        set_target_properties(meshoptimizer PROPERTIES VERSION ${PROJECT_VERSION} SOVERSION ${MESHOPT_SOVERSION})
    endif()

    if(WIN32)
        target_compile_definitions(meshoptimizer INTERFACE "MESHOPTIMIZER_API=__declspec(dllimport)")
        target_compile_definitions(meshoptimizer PRIVATE "MESHOPTIMIZER_API=__declspec(dllexport)")
    else()
        target_compile_definitions(meshoptimizer PUBLIC "MESHOPTIMIZER_API=__attribute__((visibility(\"default\")))")
    endif()

    target_compile_definitions(meshoptimizer PUBLIC MESHOPTIMIZER_ALLOC_EXPORT)

    if(MESHOPT_STABLE_EXPORTS)
		target_compile_definitions(meshoptimizer PUBLIC "MESHOPTIMIZER_EXPERIMENTAL=")
    endif()
endif()

if(MESHOPT_BUILD_DEMO)
    add_executable(demo demo/main.cpp demo/nanite.cpp demo/tests.cpp tools/objloader.cpp)
    set_target_properties(demo PROPERTIES CXX_STANDARD 11)
    set_target_properties(demo PROPERTIES OUTPUT_NAME meshoptdemo)
    target_link_libraries(demo meshoptimizer)
endif()

if(MESHOPT_BUILD_GLTFPACK)
	# copycd:: 추가.
    add_executable(gltfpack ${GLTF_SOURCES} gltf/main.cpp)
    set_target_properties(gltfpack PROPERTIES CXX_STANDARD 11)
    target_link_libraries(gltfpack meshoptimizer)

    if(MESHOPT_BUILD_SHARED_LIBS AND MESHOPT_STABLE_EXPORTS)
        target_compile_definitions(gltfpack PRIVATE GLTFPACK_NO_EXPERIMENTAL)
    endif()

    if(MESHOPT_BUILD_SHARED_LIBS)
        string(CONCAT RPATH "$ORIGIN/../" ${CMAKE_INSTALL_LIBDIR})
        set_target_properties(gltfpack PROPERTIES INSTALL_RPATH ${RPATH})
    endif()

    if(NOT MESHOPT_GLTFPACK_BASISU_PATH STREQUAL "")
        get_filename_component(BASISU_PATH ${MESHOPT_GLTFPACK_BASISU_PATH} ABSOLUTE)
        if (NOT EXISTS ${BASISU_PATH})
            message(FATAL_ERROR "Basis Universal path ${BASISU_PATH} not found")
        endif()

        if (NOT SSE AND NOT BASISU_SSE AND NOT MSVC AND CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64")
            message(WARNING "Building Basis Universal without SSE4.1 support; performance may be suboptimal")
        endif()

        add_subdirectory(${BASISU_PATH} ${CMAKE_CURRENT_BINARY_DIR}/basisu EXCLUDE_FROM_ALL)

        target_compile_definitions(gltfpack PRIVATE WITH_BASISU)
        target_link_libraries(gltfpack basisu_encoder)
        set_source_files_properties(gltf/encodebasis.cpp PROPERTIES INCLUDE_DIRECTORIES ${BASISU_PATH}) # necessary because basisu_encoder doesn't export include directories
    endif()

    if(NOT MESHOPT_GLTFPACK_LIBWEBP_PATH STREQUAL "")
        get_filename_component(LIBWEBP_PATH ${MESHOPT_GLTFPACK_LIBWEBP_PATH} ABSOLUTE)
        if (NOT EXISTS ${LIBWEBP_PATH})
            message(FATAL_ERROR "libwebp path ${LIBWEBP_PATH} not found")
        endif()

        add_subdirectory(${LIBWEBP_PATH} ${CMAKE_CURRENT_BINARY_DIR}/libwebp EXCLUDE_FROM_ALL)

        target_compile_definitions(gltfpack PRIVATE WITH_LIBWEBP)
        target_link_libraries(gltfpack webp)

        # when gltfpack is built with Basis Universal, we use Basis image decoders for PNG/JPEG support for ease of distribution
        if(NOT MESHOPT_GLTFPACK_BASISU_PATH STREQUAL "")
            target_compile_definitions(gltfpack PRIVATE WITH_LIBWEBP_BASIS)
        else()
            target_link_libraries(gltfpack imagedec)
        endif()
    endif()

    if(NOT MESHOPT_GLTFPACK_BASISU_PATH STREQUAL "" OR NOT MESHOPT_GLTFPACK_LIBWEBP_PATH STREQUAL "")
        find_package(Threads REQUIRED)
        target_link_libraries(gltfpack Threads::Threads)
    endif()
endif()

option(MESHOPT_BUILD_CCd_LINUX "Build CCd Linux shared library (CCdMeshOptimizer.so)" OFF)

if(MESHOPT_BUILD_CCd_LINUX AND NOT WIN32)
    add_library(CCdMeshOptimizer SHARED
        CCd.MeshOptimizerLinux/MyLibrary.cpp
        ${GLTF_SOURCES}
    )
    set_target_properties(CCdMeshOptimizer PROPERTIES
        CXX_STANDARD 20
        CXX_VISIBILITY_PRESET hidden
        VISIBILITY_INLINES_HIDDEN ON
        OUTPUT_NAME "HeliosenGltfpack"
    )
    target_compile_definitions(CCdMeshOptimizer PRIVATE MYLIBRARY_EXPORTS)
    target_link_libraries(CCdMeshOptimizer PRIVATE meshoptimizer dl)
    # copycd:: meshoptimizer 는 정적 라이브러리인데 이것을 공유 라이브러리(.so)에 넣는다.
    #          그래서 PIC 으로 컴파일돼 있어야 한다. (basisu_encoder 는 아래에서 이미 켜 둠)
    #          ubuntu 의 gcc 는 기본 설정 덕에 그냥 넘어가지만, RHEL 9(gcc 11)에서는
    #          "relocation R_X86_64_32S against .rodata ... recompile with -fPIC" 로
    #          링크가 실패한다. 켜 두면 양쪽 다 문제없다.
    set_target_properties(meshoptimizer PROPERTIES POSITION_INDEPENDENT_CODE ON)
    target_include_directories(CCdMeshOptimizer PRIVATE src)

    if(NOT MESHOPT_GLTFPACK_BASISU_PATH STREQUAL "")
        get_filename_component(BASISU_PATH ${MESHOPT_GLTFPACK_BASISU_PATH} ABSOLUTE)

        if(NOT TARGET basisu_encoder)
            add_library(basisu_encoder STATIC
                ${BASISU_PATH}/encoder/basisu_backend.cpp
                ${BASISU_PATH}/encoder/basisu_basis_file.cpp
                ${BASISU_PATH}/encoder/basisu_comp.cpp
                ${BASISU_PATH}/encoder/basisu_enc.cpp
                ${BASISU_PATH}/encoder/basisu_etc.cpp
                ${BASISU_PATH}/encoder/basisu_frontend.cpp
                ${BASISU_PATH}/encoder/basisu_gpu_texture.cpp
                ${BASISU_PATH}/encoder/basisu_pvrtc1_4.cpp
                ${BASISU_PATH}/encoder/basisu_resampler.cpp
                ${BASISU_PATH}/encoder/basisu_resample_filters.cpp
                ${BASISU_PATH}/encoder/basisu_ssim.cpp
                ${BASISU_PATH}/encoder/basisu_uastc_enc.cpp
                ${BASISU_PATH}/encoder/basisu_bc7enc.cpp
                ${BASISU_PATH}/encoder/jpgd.cpp
                ${BASISU_PATH}/encoder/basisu_kernels_sse.cpp
                ${BASISU_PATH}/encoder/basisu_opencl.cpp
                ${BASISU_PATH}/encoder/pvpngreader.cpp
                ${BASISU_PATH}/transcoder/basisu_transcoder.cpp
            )
            target_include_directories(basisu_encoder PUBLIC ${BASISU_PATH})
            find_library(ZSTD_LIB NAMES zstd REQUIRED)
            target_compile_definitions(basisu_encoder PUBLIC
                BASISD_SUPPORT_KTX2_ZSTD=1
                BASISU_SUPPORT_SSE=0
            )
            set_target_properties(basisu_encoder PROPERTIES POSITION_INDEPENDENT_CODE ON)
            target_compile_options(basisu_encoder PRIVATE
                -fvisibility=hidden -fno-strict-aliasing -DBASISU_SUPPORT_SSE=0
            )
            find_package(Threads REQUIRED)
            target_link_libraries(basisu_encoder Threads::Threads m ${ZSTD_LIB})
        endif()

        target_compile_definitions(CCdMeshOptimizer PRIVATE WITH_BASISU)
        target_link_libraries(CCdMeshOptimizer PRIVATE -Wl,--whole-archive basisu_encoder -Wl,--no-whole-archive)
        set_source_files_properties(gltf/encodebasis.cpp PROPERTIES INCLUDE_DIRECTORIES ${BASISU_PATH})
        find_package(Threads REQUIRED)
        target_link_libraries(CCdMeshOptimizer PRIVATE Threads::Threads)
    endif()

    # copycd:: CLI 런처(HeliosenGltfpack). 실제 구현은 libHeliosenGltfpack.so 안에 있고
    #          이 실행파일은 CallMain() 으로 넘기기만 하는 껍데기다.
    #          gltf 소스를 이 실행파일에 정적으로 링크하면 안 된다.
    #          checkModuleName() 이 dladdr(&gltfMain) 으로 모듈 파일명을 보는데,
    #          정적 링크하면 그 값이 실행파일 이름이 되어 잠금에 걸린다.
    #          .so 를 동적 링크해야 dladdr 이 .so 를 가리켜 통과한다.
    add_executable(HeliosenGltfpackCli CCd.MeshOptimizerLinux/launcher.cpp)
    set_target_properties(HeliosenGltfpackCli PROPERTIES
        CXX_STANDARD 20
        OUTPUT_NAME "HeliosenGltfpack"
        BUILD_WITH_INSTALL_RPATH TRUE
        INSTALL_RPATH "$ORIGIN"
    )
    target_link_libraries(HeliosenGltfpackCli PRIVATE CCdMeshOptimizer)
    target_include_directories(HeliosenGltfpackCli PRIVATE CCd.MeshOptimizerLinux)

    # copycd:: 배포 폴더 정리. 빌드가 끝나면 dist/linux-x64 에 실행파일과 .so 를 함께 둔다.
    #          rpath 가 $ORIGIN 이라 두 파일이 같은 폴더에만 있으면 어디서든 실행된다.
    set(CCD_DIST_DIR ${CMAKE_SOURCE_DIR}/dist/linux-x64)
    add_custom_command(TARGET HeliosenGltfpackCli POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E make_directory ${CCD_DIST_DIR}
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:CCdMeshOptimizer> ${CCD_DIST_DIR}
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:HeliosenGltfpackCli> ${CCD_DIST_DIR}
        COMMENT "[dist] HeliosenGltfpack + libHeliosenGltfpack.so -> dist/linux-x64"
    )
endif()

if(MESHOPT_INSTALL)
	include(GNUInstallDirs)

	install(TARGETS meshoptimizer EXPORT meshoptimizerTargets
	    COMPONENT meshoptimizer
	    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
	    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
	    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
	    INCLUDES DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})

	if(MESHOPT_BUILD_GLTFPACK)
	    install(TARGETS gltfpack RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR})
	endif()

	install(FILES src/meshoptimizer.h COMPONENT meshoptimizer DESTINATION ${CMAKE_INSTALL_INCLUDEDIR})
	install(EXPORT meshoptimizerTargets COMPONENT meshoptimizer DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/meshoptimizer NAMESPACE meshoptimizer::)

	if(MSVC)
		set(PDB_TARGETS meshoptimizer)
		if(MESHOPT_BUILD_GLTFPACK)
		    list(APPEND PDB_TARGETS gltfpack)
		endif()

	    foreach(TARGET ${PDB_TARGETS})
	        get_target_property(TARGET_TYPE ${TARGET} TYPE)
	        if(NOT ${TARGET_TYPE} STREQUAL "STATIC_LIBRARY")
	            install(FILES $<TARGET_PDB_FILE:${TARGET}> COMPONENT meshoptimizer DESTINATION ${CMAKE_INSTALL_BINDIR} OPTIONAL)
	        endif()
	    endforeach(TARGET)
	endif()

	include(CMakePackageConfigHelpers)

	# CMake 3.18+ supports file(CONFIGURE OUTPUT file CONTENT content @ONLY) but we only require 3.5+
	file(WRITE ${CMAKE_CURRENT_BINARY_DIR}/meshoptimizerConfig.cmake
		"include(\"\${CMAKE_CURRENT_LIST_DIR}/meshoptimizerTargets.cmake\")\n")

	write_basic_package_version_file(${CMAKE_CURRENT_BINARY_DIR}/meshoptimizerConfigVersion.cmake COMPATIBILITY ExactVersion)

	install(FILES
	    ${CMAKE_CURRENT_BINARY_DIR}/meshoptimizerConfig.cmake
	    ${CMAKE_CURRENT_BINARY_DIR}/meshoptimizerConfigVersion.cmake
	    COMPONENT meshoptimizer
	    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/meshoptimizer)
endif()
