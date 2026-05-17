<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('towns', function (Blueprint $table): void {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->id();
            $table->foreignId('region_id')->nullable()->constrained('regions')->nullOnDelete();
            $table->string('name')->nullable()->index();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['region_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('towns');
    }
};
