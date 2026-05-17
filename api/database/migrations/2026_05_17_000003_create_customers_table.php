<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->id();
            $table->foreignId('town_id')->nullable()->constrained('towns')->nullOnDelete();
            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();
            $table->string('vat_number')->nullable();
            $table->string('fiscal_code')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('address')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['last_name', 'first_name'], 'customers_name_index');
            $table->index('fiscal_code');
            $table->index('vat_number');
            $table->index('town_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
