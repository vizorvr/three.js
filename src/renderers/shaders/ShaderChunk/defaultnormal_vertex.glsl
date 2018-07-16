#ifdef FLIP_SIDED

	objectNormal = -objectNormal;

#endif

vec3 transformedNormal = normalMatrix * objectNormal;

#ifdef USE_INSTANCING
mat3 instanceNormalMatrix = mat3(instanceMatrix0.xyz, instanceMatrix1.xyz, instanceMatrix2.xyz);
transformedNormal = transformedNormal * instanceNormalMatrix;
#endif