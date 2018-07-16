vec3 transformed = vec3( position );

#ifdef USE_INSTANCING
mat4 instanceMatrix = mat4(instanceMatrix0, instanceMatrix1, instanceMatrix2, vec4(0.0, 0.0, 0.0, 1.0));
// instance matrix is the transpose:
transformed = (vec4(position.xyz, 1.0) * instanceMatrix).xyz;
#endif