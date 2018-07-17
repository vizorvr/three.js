vec3 transformedNormal = normalMatrix * objectNormal;

#ifdef FLIP_SIDED

	transformedNormal = - transformedNormal;

#endif

#ifdef USE_INSTANCING
mat3 instanceNormalMatrix = mat3(instanceMatrix0.xyz, instanceMatrix1.xyz, instanceMatrix2.xyz);
transformedNormal = transformedNormal * instanceNormalMatrix;
#endif