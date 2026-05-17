<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'town_id',
        'first_name',
        'last_name',
        'vat_number',
        'fiscal_code',
        'email',
        'birth_date',
        'address',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function town(): BelongsTo
    {
        return $this->belongsTo(Town::class);
    }

    public function phones(): HasMany
    {
        return $this->hasMany(CustomerPhone::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function secondaryOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'secondary_customer_id');
    }
}
