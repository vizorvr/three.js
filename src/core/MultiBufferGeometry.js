import {Matrix4} from "../math/Matrix4";
import {InstancedBufferGeometry} from "./InstancedBufferGeometry";
import {InstancedBufferAttribute} from "./InstancedBufferAttribute";
import {BufferGeometry} from "./BufferGeometry";

function MultiBufferGeometry()
{
    // TODO: Wherever needsUpdate is set, we should have to define the update range
    InstancedBufferGeometry.call(this);

    // at least use the one instance
    this.maxInstancedCount = 0;
    this.frustumCulled = false;

    // every instance has an ID that doesn't change as objects are added or removed
    // this is because removing random objects change the instance index
    this.idToIndex = {};
    this.indexToID = [];    // array since it's dense

    this._currID = 0;

    // storing matrices as ROWS so we can easily use 4x3 datasets
    this._matAttrib0 = null;    // row 0
    this._matAttrib1 = null;    // row 1
    this._matAttrib2 = null;    // row 2

    this.type = 'MultiBufferGeometry';
}

MultiBufferGeometry.prototype = Object.assign(Object.create(InstancedBufferGeometry.prototype), {
    createInstance: function ()
    {
        var id = this._getNextID();
        var index = this.maxInstancedCount++;
        this.indexToID[index] = id;
        this.idToIndex[id] = index;

        this._pushInstanceAttribData(this._matAttrib0, 1, 0, 0, 0);
        this._pushInstanceAttribData(this._matAttrib1, 0, 1, 0, 0);
        this._pushInstanceAttribData(this._matAttrib2, 0, 0, 1, 0);

        return id;
    },

    destroyInstance: function (id)
    {
        var index = this.idToIndex[id];

        // remove lookups
        delete this.idToIndex[id];
        this.indexToID.splice(index, 1);

        --this.maxInstancedCount;

        this._removeInstanceAttribData(this._matAttrib0, index);
        this._removeInstanceAttribData(this._matAttrib1, index);
        this._removeInstanceAttribData(this._matAttrib2, index);
    },

    setMatrix: function (id, matrix)
    {
        var s = this.idToIndex[id] << 2;
        var m = matrix.elements;
        var ma0 = this._matAttrib0.array;
        var ma1 = this._matAttrib1.array;
        var ma2 = this._matAttrib2.array;

        ma0[s] = m[0];
        ma1[s] = m[1];
        ma2[s] = m[2];
        ++s;
        ma0[s] = m[4];
        ma1[s] = m[5];
        ma2[s] = m[6];
        ++s;
        ma0[s] = m[8];
        ma1[s] = m[9];
        ma2[s] = m[10];
        ++s;
        ma0[s] = m[12];
        ma1[s] = m[13];
        ma2[s] = m[14];

        this._invalidateTransforms();
    },

    getMatrix: function(id, target)
    {
        return this.getMatrixByIndex(this.idToIndex[id], target);
    },

    getMatrixByIndex: function(index, target)
    {
        var s = index << 2;
        target = target || new Matrix4();
        var m = target.elements;
        m[3] = m[7] = m[11] = 0;
        m[15] = 1;

        var ma0 = this._matAttrib0.array;
        var ma1 = this._matAttrib1.array;
        var ma2 = this._matAttrib2.array;

        ma0[s] = m[0];
        ma1[s] = m[1];
        ma2[s] = m[2];
        ++s;
        ma0[s] = m[4];
        ma1[s] = m[5];
        ma2[s] = m[6];
        ++s;
        ma0[s] = m[8];
        ma1[s] = m[9];
        ma2[s] = m[10];
        ++s;
        ma0[s] = m[12];
        ma1[s] = m[13];
        ma2[s] = m[14];

        return target;
    },

    fromBufferGeometry: function (geometry)
    {
        BufferGeometry.prototype.copy.call(this, geometry);

        this._matAttrib0 = new InstancedBufferAttribute(new Float32Array([]), 4, 1).setDynamic(true);
        this._matAttrib1 = new InstancedBufferAttribute(new Float32Array([]), 4, 1).setDynamic(true);
        this._matAttrib2 = new InstancedBufferAttribute(new Float32Array([]), 4, 1).setDynamic(true);
        this.addAttribute("instanceMatrix0", this._matAttrib0);
        this.addAttribute("instanceMatrix1", this._matAttrib1);
        this.addAttribute("instanceMatrix2", this._matAttrib2);

        this.maxInstancedCount = 0;
    },

    _getNextID: function ()
    {
        return this._currID++;
    },

    _invalidateTransforms: function ()
    {
        this._matAttrib0.needsUpdate = true;
        this._matAttrib1.needsUpdate = true;
        this._matAttrib2.needsUpdate = true;
    },

    // arr is a typed array and thus fixed length
    _removeInstanceAttribData: function(attrib, index)
    {
        var arr = attrib.array;
        var s = index << 2;
        var srcLen = arr.length;
        var newArray = new Float32Array(srcLen - 4);

        for (var i = 0; i < s; ++i) {
            newArray[i] = arr[i];
        }

        for (var j = i + 4; j < srcLen; ++i, ++j) {
            newArray[i] =  arr[j];
        }

        attrib.array = newArray;
        attrib.needsUpdate = true;
        --attrib.count;
    },

    _pushInstanceAttribData: function(attrib, m0, m1, m2, m3)
    {
        var arr = attrib.array;
        var srcLen = arr.length;
        var newArray = new Float32Array(srcLen + 4);

        for (var i = 0; i < srcLen; ++i) {
            newArray[i] = arr[i];
        }

        newArray[srcLen] = m0;
        newArray[srcLen + 1] = m1;
        newArray[srcLen + 2] = m2;
        newArray[srcLen + 3] = m3;

        attrib.array = newArray;
        attrib.needsUpdate = true;
        ++attrib.count;
    }

});

export {MultiBufferGeometry};