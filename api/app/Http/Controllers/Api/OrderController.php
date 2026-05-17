<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class OrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with(['items.productModel', 'attachments'])
            ->orderByDesc('order_date')
            ->get()
            ->map(fn (Order $order): array => $this->toFrontend($order));

        return response()->json($orders);
    }

    public function store(Request $request): JsonResponse
    {
        $order = Order::query()->create($this->orderData($request));

        $this->syncItems($order, $request);
        $this->syncAttachments($order, $request);

        return response()->json($this->toFrontend($order->fresh(['items.productModel', 'attachments'])), 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json($this->toFrontend($order->load(['items.productModel', 'attachments'])));
    }

    public function update(Request $request, Order $order): JsonResponse
    {
        $order->update($this->orderData($request));

        if ($this->hasItemPayload($request)) {
            $this->syncItems($order, $request);
        }

        if ($this->hasAttachmentPayload($request)) {
            $this->syncAttachments($order, $request);
        }

        return response()->json($this->toFrontend($order->fresh(['items.productModel', 'attachments'])));
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->items()->delete();
        $order->attachments()->delete();
        $order->delete();

        return response()->json(null, 204);
    }

    private function orderData(Request $request): array
    {
        return [
            'customer_id' => $this->intValue($request, ['clienteId', 'cliente_id', 'customer_id']),
            'secondary_customer_id' => $this->intValue($request, [
                'secondaPersonaId',
                'seconda_persona_id',
                'secondary_customer_id',
            ]),
            'order_date' => $this->stringValue($request, ['dataOrdine', 'data_ordine', 'order_date']),
            'description' => $this->stringValue($request, ['descrizione', 'description']),
        ];
    }

    private function syncItems(Order $order, Request $request): void
    {
        $order->items()->delete();

        $items = $request->input('items');
        if (is_array($items)) {
            foreach ($items as $item) {
                if (! is_array($item)) {
                    continue;
                }

                $order->items()->create([
                    'product_model_id' => $this->nullableInt($item['product_model_id'] ?? $item['modelloId'] ?? null),
                    'description' => $this->nullableString($item['description'] ?? $item['descrizione'] ?? null),
                ]);
            }

            return;
        }

        $modelIds = $request->input('product_model_ids', $request->input('modelloIds'));
        if (is_array($modelIds)) {
            foreach ($modelIds as $modelId) {
                $order->items()->create([
                    'product_model_id' => $this->nullableInt($modelId),
                    'description' => null,
                ]);
            }

            return;
        }

        $modelId = $this->intValue($request, ['modelloId', 'modello_id', 'product_model_id']);
        $description = $this->stringValue($request, ['item_description', 'descrizione_riga']);

        if ($modelId !== null || $description !== null) {
            $order->items()->create([
                'product_model_id' => $modelId,
                'description' => $description,
            ]);
        }
    }

    private function syncAttachments(Order $order, Request $request): void
    {
        $metas = $this->attachmentMetas($request);
        $files = $this->attachmentFiles($request);
        $keepIds = [];

        foreach ($metas as $index => $meta) {
            if (! is_array($meta)) {
                continue;
            }

            $file = $files[$index] ?? null;
            if ($file instanceof UploadedFile) {
                $keepIds[] = $this->createAttachment($order, $file, $meta);

                continue;
            }

            $attachmentId = $this->nullableInt($meta['id'] ?? null);
            if ($attachmentId !== null) {
                $attachment = $order->attachments()->whereKey($attachmentId)->first();
                if ($attachment) {
                    $attachment->update([
                        'type' => $this->dbAttachmentType($meta['tipo'] ?? $meta['type'] ?? $attachment->type),
                        'original_name' => $this->nullableString($meta['nome'] ?? $meta['original_name'] ?? $attachment->original_name),
                    ]);
                    $keepIds[] = $attachment->id;
                }
            }
        }

        foreach ($files as $index => $file) {
            if (! $file instanceof UploadedFile || array_key_exists($index, $metas)) {
                continue;
            }

            $keepIds[] = $this->createAttachment($order, $file, []);
        }

        if ($this->hasAttachmentPayload($request)) {
            $query = $order->attachments();
            if ($keepIds !== []) {
                $query->whereNotIn('id', $keepIds);
            }
            $query->delete();
        }
    }

    private function createAttachment(Order $order, UploadedFile $file, array $meta): int
    {
        $path = $file->store('order-attachments', 'public');

        $attachment = $order->attachments()->create([
            'type' => $this->dbAttachmentType($meta['tipo'] ?? $meta['type'] ?? null),
            'original_name' => $this->nullableString($meta['nome'] ?? $meta['original_name'] ?? null) ?? $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return $attachment->id;
    }

    private function toFrontend(Order $order): array
    {
        $firstItem = $order->items->first();

        return [
            'id' => (string) $order->id,
            'clienteId' => $order->customer_id ? (string) $order->customer_id : '',
            'dataOrdine' => optional($order->order_date)->format('Y-m-d') ?? '',
            'modelloId' => $firstItem?->product_model_id ? (string) $firstItem->product_model_id : '',
            'secondaPersonaId' => $order->secondary_customer_id ? (string) $order->secondary_customer_id : null,
            'allegati' => $order->attachments
                ->map(fn ($attachment): array => [
                    'id' => (string) $attachment->id,
                    'nome' => $attachment->original_name ?? '',
                    'tipo' => $this->frontendAttachmentType($attachment->type),
                    'mimeType' => $attachment->mime_type,
                    'dimensione' => $attachment->file_size,
                    'url' => $attachment->file_path ? url(Storage::disk('public')->url($attachment->file_path)) : null,
                ])
                ->values()
                ->all(),
        ];
    }

    private function hasItemPayload(Request $request): bool
    {
        return $request->hasAny([
            'items',
            'product_model_ids',
            'modelloIds',
            'modelloId',
            'modello_id',
            'product_model_id',
        ]);
    }

    private function hasAttachmentPayload(Request $request): bool
    {
        return $request->has('allegati')
            || $request->has('attachments')
            || $request->has('allegati_meta')
            || $request->has('attachments_meta')
            || $request->hasFile('allegati')
            || $request->hasFile('attachments');
    }

    private function attachmentMetas(Request $request): array
    {
        $metas = $request->input('allegati_meta', $request->input('attachments_meta'));
        if (is_array($metas)) {
            return $metas;
        }

        $attachments = $request->input('allegati', $request->input('attachments', []));

        return is_array($attachments) ? $attachments : [];
    }

    private function attachmentFiles(Request $request): array
    {
        $files = $request->file('allegati', $request->file('attachments', []));

        if ($files instanceof UploadedFile) {
            return [$files];
        }

        return is_array($files) ? $files : [];
    }

    private function dbAttachmentType(?string $type): ?string
    {
        return match ($type) {
            'fattura', 'invoice' => 'invoice',
            'ordine', 'order_document' => 'order_document',
            default => $this->nullableString($type) ?? 'other',
        };
    }

    private function frontendAttachmentType(?string $type): string
    {
        return match ($type) {
            'invoice' => 'fattura',
            'order_document' => 'ordine',
            default => 'altro',
        };
    }

    private function intValue(Request $request, array $keys): ?int
    {
        foreach ($keys as $key) {
            if ($request->has($key)) {
                return $this->nullableInt($request->input($key));
            }
        }

        return null;
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

    private function nullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
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
