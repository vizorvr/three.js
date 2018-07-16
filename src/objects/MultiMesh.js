import { Mesh } from "./Mesh";
import { MultiBufferGeometry } from "../core/MultiBufferGeometry";
import {Matrix4} from "../math/Matrix4";

// this uses an instanced buffer geometry in order to draw clones of objects (the only per-instance data is the transform)
// WARNING: geometry is not shared, but a unique instance of BufferGeometry is created. This is because the geometry will
// need to store instance-dependent transforms. This is acceptable, since the MultiMesh's purpose is to be shared itself,
// and as such replaces the purpose of a shared geometry.
function MultiMesh(geometry, material)
{
    // TODO: Allow using instancing in default materials
    var bufferGeometry = new MultiBufferGeometry();
    bufferGeometry.fromBufferGeometry(geometry);
    Mesh.call(this, bufferGeometry, material);

    this.type = 'MultiMesh';
    this._worldMatrices = [];
    this._allMatricesInvalid = false;

    // TODO: Need to assign transforms per instance
}

MultiMesh.prototype = Object.assign( Object.create( Mesh.prototype ), {
    constructor: MultiMesh,

    isMesh: true,

    // wrapper functions:
    createInstance: function()
    {
        this._worldMatrices.push(this.matrixWorld.clone());
        return this.geometry.createInstance();
    },

    destroyInstance: function(id)
    {
        this.geometry.destroyInstance(id);
        var index = this.geometry.idToIndex[id];
        this._worldMatrices.splice(index, 1);
    },

    setMatrix: function (id, matrix)
    {
        if (this.matrixWorldNeedsUpdate) this.updateMatrixWorld();
        this.geometry.setMatrix(id, matrix);
        var index = this.geometry.idToIndex[id];
        var worldMatrix = this._worldMatrices[index];
        worldMatrix.multiplyMatrices(this.matrixWorld, matrix);
        worldMatrix.copy(matrix);
    },

    getMatrix: function (id, target)
    {
        return this.geometry.getMatrix(id, target);
    },

    raycast: function( raycaster, intersects )
    {
        if (this.matrixWorldNeedsUpdate)
            this.updateMatrixWorld(true);

        if (this._allMatricesInvalid)
            this._updateWorldMatrices();

        var mats = this._worldMatrices;
        var len = mats.length;
        var matWorld = this.matrixWorld;
        for (var i = 0; i < len; ++i) {
            // temporarily override matrix with instance's local matrix
            this.matrixWorld = mats[i];
            Mesh.prototype.raycast.call(this, raycaster, intersects);
        }
        this.matrixWorld = matWorld;
    },

    updateMatrixWorld: function(force)
    {
        if (this.matrixWorldNeedsUpdate)
            this._allMatricesInvalid = true;

        Mesh.prototype.updateMatrixWorld.call(this, force);
    },

    _updateWorldMatrices: function()
    {
        var m = new Matrix4();
        return function() {
            var mats = this._worldMatrices;
            var len = mats.length;
            var geom = this.geometry;
            for (var i = 0; i < len; ++i) {
                geom.getMatrixByIndex(i, m);
                mats[i].multiplyMatrices(this.matrixWorld, m);
            }

            this._allMatricesInvalid = false;
        }
    }()

});

export { MultiMesh };