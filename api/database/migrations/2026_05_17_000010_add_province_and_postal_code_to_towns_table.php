<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('towns', function (Blueprint $table): void {
            if (! Schema::hasColumn('towns', 'province')) {
                $table->string('province')->nullable()->after('name')->index();
            }

            if (! Schema::hasColumn('towns', 'postal_code')) {
                $table->string('postal_code', 20)->nullable()->after('province')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('towns', function (Blueprint $table): void {
            if (Schema::hasColumn('towns', 'postal_code')) {
                $table->dropIndex(['postal_code']);
                $table->dropColumn('postal_code');
            }

            if (Schema::hasColumn('towns', 'province')) {
                $table->dropIndex(['province']);
                $table->dropColumn('province');
            }
        });
    }
};
