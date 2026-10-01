<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

abstract class LegacyModel extends Model
{
    /** Concrete models must explicitly declare their legacy table/key behavior. */
    public $timestamps = false;

    protected $guarded = [];
}
