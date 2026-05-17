<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->engine = 'InnoDB';
            $table->charset = 'utf8mb4';
            $table->collation = 'utf8mb4_unicode_ci';

            $table->id();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table
                ->foreignId('secondary_customer_id')
                ->nullable()
                ->constrained('customers')
                ->nullOnDelete();
            $table->date('order_date')->nullable()->index();
            $table->text('description')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('customer_id');
            $table->index('secondary_customer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
