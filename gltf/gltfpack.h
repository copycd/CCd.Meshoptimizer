/**
 * gltfpack - version 0.24
 *
 * Copyright (C) 2016-2025, by Arseny Kapoulkine (arseny.kapoulkine@gmail.com)
 * Report bugs and download new versions at https://github.com/zeux/meshoptimizer
 *
 * This application is distributed under the MIT License. See notice at the end of this file.
 */
#pragma once

#ifndef _CRT_SECURE_NO_WARNINGS
#define _CRT_SECURE_NO_WARNINGS
#endif

#ifndef _CRT_NONSTDC_NO_WARNINGS
#define _CRT_NONSTDC_NO_WARNINGS
#endif

#include "../extern/cgltf.h"

#include <assert.h>

#include <string>
#include <vector>
// copycd::
#include <filesystem>

struct Attr
{
	float f[4];
};

struct Stream
{
	cgltf_attribute_type type;
	int index;
	int target; // 0 = base mesh, 1+ = morph target

	const char* custom_name; // only valid for cgltf_attribute_type_custom

	std::vector<Attr> data;
};

struct Transform
{
	float data[16];
};

struct Mesh
{
	int scene;
	std::vector<cgltf_node*> nodes;
	std::vector<Transform> instances;

	cgltf_material* material;
	cgltf_skin* skin;

	cgltf_extras extras;

	cgltf_primitive_type type;

	std::vector<Stream> streams;
	std::vector<unsigned int> indices;

	bool geometry_duplicate;
	uint64_t geometry_hash[2];

	size_t targets;
	std::vector<float> target_weights;
	std::vector<const char*> target_names;

	std::vector<cgltf_material_mapping> variants;

	float quality;
};

struct Track
{
	cgltf_node* node;
	cgltf_animation_path_type path;

	bool constant;
	bool dummy;

	size_t components; // 1 unless path is cgltf_animation_path_type_weights

	cgltf_interpolation_type interpolation;

	std::vector<float> time; // empty for resampled or constant animations
	std::vector<Attr> data;
};

struct Animation
{
	const char* name;

	float start;
	int frames;

	std::vector<Track> tracks;
};

enum TextureKind
{
	TextureKind_Generic,
	TextureKind_Color,
	TextureKind_Normal,
	TextureKind_Attrib,

	TextureKind__Count
};

enum TextureMode
{
	TextureMode_Raw,
	TextureMode_ETC1S,
	TextureMode_UASTC,
};

struct Settings
{
	int pos_bits;
	int tex_bits;
	int nrm_bits;
	int col_bits;

	bool pos_normalized;
	bool pos_float;
	bool tex_float;
	bool nrm_float;

	int trn_bits;
	int rot_bits;
	int scl_bits;

	int anim_freq;
	bool anim_const;

	bool keep_nodes;
	bool keep_materials;
	bool keep_extras;
	bool keep_attributes;

	bool mesh_dedup;
	bool mesh_merge;
	bool mesh_instancing;

	float simplify_ratio;
	float simplify_error;
	bool simplify_aggressive;
	bool simplify_lock_borders;
	bool simplify_attributes;
	bool simplify_scaled;

	bool texture_ktx2;
	bool texture_embed;
	bool texture_ref;

	bool texture_pow2;
	bool texture_flipy;
	float texture_scale[TextureKind__Count];
	int texture_limit[TextureKind__Count];

	TextureMode texture_mode[TextureKind__Count];
	int texture_quality[TextureKind__Count];

	int texture_jobs;

	bool quantize;

	bool compress;
	bool compressmore;
	bool compressexp;
	bool fallback;

	int verbose;

	// copycd::
	// 만일 컴파일 오류나면, vs환경에서 c++ 버전을 최신으로 변경.
	std::filesystem::path baseRootPath;
};

struct QuantizationPosition
{
	float offset[3];
	float scale;
	int bits;
	bool normalized;

	float node_scale; // computed from scale/bits/normalized
};

struct QuantizationTexture
{
	float offset[2];
	float scale[2];
	int bits;
	bool normalized;
};

struct StreamFormat
{
	enum Filter
	{
		Filter_None,
		Filter_Oct,
		Filter_Quat,
		Filter_Exp,
		Filter_Color,
	};

	cgltf_type type;
	cgltf_component_type component_type;
	bool normalized;
	size_t stride;
	Filter filter;
};

struct NodeInfo
{
	int scene;

	bool keep;
	bool animated;

	unsigned int animated_path_mask;

	int remap;

	std::vector<size_t> mesh_nodes;

	bool has_mesh;
	size_t mesh_index;
	cgltf_skin* mesh_skin;
};

struct MaterialInfo
{
	bool keep;

	bool uses_texture_transform;
	bool needs_tangents;
	bool unlit;
	bool mesh_alpha;

	unsigned int texture_set_mask;

	int remap;
};

struct TextureInfo
{
	bool keep;

	int remap;
};

struct ImageInfo
{
	TextureKind kind;
	bool normal_map;
	bool srgb;

	int channels;
};

struct ExtensionInfo
{
	const char* name;

	bool used;
	bool required;
};

struct BufferView
{
	enum Kind
	{
		Kind_Vertex,
		Kind_Index,
		Kind_Skin,
		Kind_Time,
		Kind_Keyframe,
		Kind_Instance,
		Kind_Image,
		Kind_Count
	};

	enum Compression
	{
		Compression_None = -1,
		Compression_Attribute,
		Compression_Index,
		Compression_IndexSequence,
	};

	Kind kind;
	StreamFormat::Filter filter;
	Compression compression;
	size_t stride;
	int variant;

	std::string data;

	size_t bytes;
};

// copycd::
int gltfMain(int argc, char** argv);

std::string getTempPrefix();

std::string getFullPath(const char* path, const char* base_path);
std::string getFileName(const char* path);
std::string getExtension(const char* path);

bool readFile(const char* path, std::string& data);
bool writeFile(const char* path, const std::string& data);
void removeFile(const char* path);

cgltf_data* parseObj(const char* path, std::vector<Mesh>& meshes, const char** error);
cgltf_data* parseGltf(const char* path, std::vector<Mesh>& meshes, std::vector<Animation>& animations, const char** error);

cgltf_data* parseGlb(const void* buffer, size_t size, std::vector<Mesh>& meshes, std::vector<Animation>& animations, const char** error);

bool areExtrasEqual(const cgltf_extras& lhs, const cgltf_extras& rhs);

void processAnimation(Animation& animation, const Settings& settings);
void processMesh(Mesh& mesh, const Settings& settings);

bool compareMeshTargets(const Mesh& lhs, const Mesh& rhs);
bool compareMeshVariants(const Mesh& lhs, const Mesh& rhs);
bool compareMeshNodes(const Mesh& lhs, const Mesh& rhs);

void hashMesh(Mesh& mesh);
void dedupMeshes(std::vector<Mesh>& meshes, const Settings& settings);
void mergeMeshInstances(Mesh& mesh);
void mergeMeshes(std::vector<Mesh>& meshes, const Settings& settings);
void filterEmptyMeshes(std::vector<Mesh>& meshes);
void filterStreams(Mesh& mesh, const MaterialInfo& mi);

void mergeMeshMaterials(cgltf_data* data, std::vector<Mesh>& meshes, const Settings& settings);
void markNeededMaterials(cgltf_data* data, std::vector<MaterialInfo>& materials, const std::vector<Mesh>& meshes, const Settings& settings);

void mergeTextures(cgltf_data* data, std::vector<TextureInfo>& textures);

bool hasValidTransform(const cgltf_texture_view& view);

void analyzeMaterials(cgltf_data* data, std::vector<MaterialInfo>& materials, std::vector<TextureInfo>& textures, std::vector<ImageInfo>& images);
void optimizeMaterials(cgltf_data* data, std::vector<MaterialInfo>& materials, std::vector<ImageInfo>& images, const char* input_path);

bool readImage(const cgltf_image& image, const char* input_path, std::string& data, std::string& mime_type);
bool hasAlpha(const std::string& data, const char* mime_type);
bool getDimensions(const std::string& data, const char* mime_type, int& width, int& height);
void adjustDimensions(int& width, int& height, float scale, int limit, bool pow2);
const char* mimeExtension(const char* mime_type);

#ifdef WITH_BASISU
void encodeImages(std::string* encoded, const cgltf_data* data, const std::vector<ImageInfo>& images, const char* input_path, const Settings& settings);
#endif

void markScenes(cgltf_data* data, std::vector<NodeInfo>& nodes);
void markAnimated(cgltf_data* data, std::vector<NodeInfo>& nodes, const std::vector<Animation>& animations);
void markNeededNodes(cgltf_data* data, std::vector<NodeInfo>& nodes, const std::vector<Mesh>& meshes, const std::vector<Animation>& animations, const Settings& settings);
void remapNodes(cgltf_data* data, std::vector<NodeInfo>& nodes, size_t& node_offset);
void decomposeTransform(float translation[3], float rotation[4], float scale[3], const float* transform);

void computeMeshQuality(std::vector<Mesh>& meshes);

bool hasAlpha(const Mesh& mesh);

QuantizationPosition prepareQuantizationPosition(const std::vector<Mesh>& meshes, const Settings& settings);
void prepareQuantizationTexture(cgltf_data* data, std::vector<QuantizationTexture>& result, std::vector<size_t>& indices, const std::vector<Mesh>& meshes, const Settings& settings);
void getPositionBounds(float min[3], float max[3], const Stream& stream, const QuantizationPosition& qp, const Settings& settings);

StreamFormat writeVertexStream(std::string& bin, const Stream& stream, const QuantizationPosition& qp, const QuantizationTexture& qt, const Settings& settings);
StreamFormat writeIndexStream(std::string& bin, const std::vector<unsigned int>& stream);
StreamFormat writeTimeStream(std::string& bin, const std::vector<float>& data);
StreamFormat writeKeyframeStream(std::string& bin, cgltf_animation_path_type type, const std::vector<Attr>& data, const Settings& settings, bool has_tangents = false);

void compressVertexStream(std::string& bin, const std::string& data, size_t count, size_t stride);
void compressIndexStream(std::string& bin, const std::string& data, size_t count, size_t stride);
void compressIndexSequence(std::string& bin, const std::string& data, size_t count, size_t stride);

size_t getBufferView(std::vector<BufferView>& views, BufferView::Kind kind, StreamFormat::Filter filter, BufferView::Compression compression, size_t stride, int variant = 0);

void comma(std::string& s);
void append(std::string& s, size_t v);
void append(std::string& s, float v);
void append(std::string& s, const char* v);
void append(std::string& s, const std::string& v);
void append(std::string& s, const float* data, size_t count);
void appendJson(std::string& s, const char* data);

const char* attributeType(cgltf_attribute_type type);
const char* animationPath(cgltf_animation_path_type type);

void writeMaterial(std::string& json, const cgltf_data* data, const cgltf_material& material, const QuantizationPosition* qp, const QuantizationTexture* qt, std::vector<TextureInfo>& textures);
void writeBufferView(std::string& json, BufferView::Kind kind, StreamFormat::Filter filter, size_t count, size_t stride, size_t bin_offset, size_t bin_size, BufferView::Compression compression, size_t compressed_offset, size_t compressed_size);
void writeSampler(std::string& json, const cgltf_sampler& sampler);
void writeImage(std::string& json, std::vector<BufferView>& views, const cgltf_image& image, const ImageInfo& info, const std::string* encoded, size_t index, const char* input_path, const char* output_path, const Settings& settings);
void writeTexture(std::string& json, const cgltf_texture& texture, const ImageInfo* info, cgltf_data* data, const Settings& settings);
void writeMeshAttributes(std::string& json, std::vector<BufferView>& views, std::string& json_accessors, size_t& accr_offset, const Mesh& mesh, int target, const QuantizationPosition& qp, const QuantizationTexture& qt, const Settings& settings);
size_t writeMeshIndices(std::vector<BufferView>& views, std::string& json_accessors, size_t& accr_offset, const std::vector<unsigned int>& indices, cgltf_primitive_type type, const Settings& settings);
void writeMeshGeometry(std::string& json, std::vector<BufferView>& views, std::string& json_accessors, size_t& accr_offset, const Mesh& mesh, const QuantizationPosition& qp, const QuantizationTexture& qt, const Settings& settings);
size_t writeJointBindMatrices(std::vector<BufferView>& views, std::string& json_accessors, size_t& accr_offset, const cgltf_skin& skin, const QuantizationPosition& qp, const Settings& settings);
size_t writeInstances(std::vector<BufferView>& views, std::string& json_accessors, size_t& accr_offset, const std::vector<Transform>& transforms, const QuantizationPosition& qp, const Settings& settings);
void writeMeshNode(std::string& json, size_t mesh_offset, cgltf_node* node, cgltf_skin* skin, cgltf_data* data, const QuantizationPosition* qp);
void writeMeshNodeInstanced(std::string& json, size_t mesh_offset, size_t accr_offset);
void writeSkin(std::string& json, const cgltf_skin& skin, size_t matrix_accr, const std::vector<NodeInfo>& nodes, cgltf_data* data);
void writeNode(std::string& json, const cgltf_node& node, const std::vector<NodeInfo>& nodes, cgltf_data* data);
void writeAnimation(std::string& json, std::vector<BufferView>& views, std::string& json_accessors, size_t& accr_offset, const Animation& animation, size_t i, cgltf_data* data, const std::vector<NodeInfo>& nodes, const Settings& settings);
void writeCamera(std::string& json, const cgltf_camera& camera);
void writeLight(std::string& json, const cgltf_light& light);
void writeArray(std::string& json, const char* name, const std::string& contents);
void writeExtensions(std::string& json, const ExtensionInfo* extensions, size_t count);
void writeExtras(std::string& json, const cgltf_extras& extras);
void writeScene(std::string& json, const cgltf_scene& scene, const std::string& roots, const Settings& settings);

/**
 * Copyright (c) 2016-2025 Arseny Kapoulkine
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
