<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Region;
use App\Models\Town;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class CustomerController extends Controller
{
    public function index(): JsonResponse
    {
        $customers = Customer::query()
            ->with(['town.region', 'phones', 'orders', 'secondaryOrders'])
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (Customer $customer): array => $this->toFrontend($customer));

        return response()->json($customers);
    }

    public function orderCounts(): JsonResponse
    {
        $counts = Customer::query()
            ->withCount(['orders', 'secondaryOrders'])
            ->get()
            ->mapWithKeys(fn (Customer $customer): array => [
                (string) $customer->id => $customer->orders_count + $customer->secondary_orders_count,
            ]);

        return response()->json($counts);
    }

    public function store(Request $request): JsonResponse
    {
        $customer = Customer::query()->create($this->customerData($request));
        $this->syncPhones($customer, $request);

        return response()->json($this->toFrontend($customer->fresh(['town.region', 'phones', 'orders', 'secondaryOrders'])), 201);
    }

    public function show(Customer $customer): JsonResponse
    {
        return response()->json($this->toFrontend($customer->load(['town.region', 'phones', 'orders', 'secondaryOrders'])));
    }

    public function update(Request $request, Customer $customer): JsonResponse
    {
        $customer->update($this->customerData($request));

        if ($request->has('telefoni') || $request->has('phones')) {
            $this->syncPhones($customer, $request);
        }

        return response()->json($this->toFrontend($customer->fresh(['town.region', 'phones', 'orders', 'secondaryOrders'])));
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $customer->phones()->delete();
        $customer->delete();

        return response()->json(null, 204);
    }

    private function customerData(Request $request): array
    {
        return [
            'town_id' => $this->resolveTownId($request),
            'first_name' => $this->stringValue($request, ['nome', 'first_name']),
            'last_name' => $this->stringValue($request, ['cognome', 'last_name']),
            'vat_number' => $this->stringValue($request, ['partitaIva', 'partita_iva', 'vat_number']),
            'fiscal_code' => $this->stringValue($request, ['codiceFiscale', 'codice_fiscale', 'fiscal_code']),
            'birth_date' => $this->stringValue($request, ['dataNascita', 'data_nascita', 'birth_date']),
            'address' => $this->stringValue($request, ['via', 'address']),
            'notes' => $this->stringValue($request, ['notes', 'note']),
        ];
    }

    private function resolveTownId(Request $request): ?int
    {
        $townId = $request->input('town_id');
        if ($townId !== null && $townId !== '') {
            return (int) $townId;
        }

        $regionName = $this->stringValue($request, ['regione', 'region', 'region.name']);
        $townName = $this->stringValue($request, ['paese', 'town', 'town.name']);

        if ($townName === null && $regionName === null) {
            return null;
        }

        $region = null;
        if ($regionName !== null) {
            $region = Region::query()->firstOrCreate(['name' => $regionName]);
        }

        return Town::query()
            ->firstOrCreate([
                'region_id' => $region?->id,
                'name' => $townName,
            ])
            ->id;
    }

    private function syncPhones(Customer $customer, Request $request): void
    {
        $phones = $request->input('telefoni', $request->input('phones', []));
        if (! is_array($phones)) {
            return;
        }

        $customer->phones()->delete();

        foreach ($phones as $phone) {
            if (! is_array($phone)) {
                continue;
            }

            $customer->phones()->create([
                'phone_number' => $this->nullableString($phone['numero'] ?? $phone['phone_number'] ?? null),
                'label' => $this->nullableString($phone['label'] ?? null),
                'is_primary' => array_key_exists('principale', $phone)
                    ? (bool) $phone['principale']
                    : (array_key_exists('is_primary', $phone) ? (bool) $phone['is_primary'] : null),
            ]);
        }
    }

    private function toFrontend(Customer $customer): array
    {
        $orders = $this->ordersForLastDate($customer);
        $lastOrder = $orders
            ->pluck('order_date')
            ->filter()
            ->sortDesc()
            ->first();

        return [
            'id' => (string) $customer->id,
            'nome' => $customer->first_name ?? '',
            'cognome' => $customer->last_name ?? '',
            'partitaIva' => $customer->vat_number ?? '',
            'codiceFiscale' => $customer->fiscal_code ?? '',
            'dataNascita' => optional($customer->birth_date)->format('Y-m-d') ?? '',
            'via' => $customer->address ?? '',
            'paese' => $customer->town?->name ?? '',
            'regione' => $customer->town?->region?->name ?? '',
            'telefoni' => $customer->phones
                ->map(fn ($phone): array => [
                    'id' => (string) $phone->id,
                    'numero' => $phone->phone_number ?? '',
                    'label' => $phone->label,
                    'principale' => (bool) $phone->is_primary,
                ])
                ->values()
                ->all(),
            'dataUltimoOrdine' => $lastOrder ? $lastOrder->format('Y-m-d') : null,
        ];
    }

    private function ordersForLastDate(Customer $customer): Collection
    {
        return $customer->orders->merge($customer->secondaryOrders);
    }

    private function stringValue(Request $request, array $keys): ?string
    {
        foreach ($keys as $key) {
            if ($request->has($key)) {
                return $this->nullableString($request->input($key));
            }
        }

        return null;
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
