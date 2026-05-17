<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Town extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'region_id',
        'name',
        'province',
        'postal_code',
        'description',
    ];

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function customers(): HasMany
    {
        return $this->hasMany(Customer::class);
    }
}
