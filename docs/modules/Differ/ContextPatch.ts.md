---
title: Differ/ContextPatch.ts
nav_order: 5
parent: Modules
---

## ContextPatch overview

Added in v1.0.0

---

<h2 class="text-delta">Table of contents</h2>

- [constructors](#constructors)
  - [diff](#diff)
  - [empty](#empty)
- [destructors](#destructors)
  - [patch](#patch)
- [model](#model)
  - [ContextPatch (interface)](#contextpatch-interface)
- [mutations](#mutations)
  - [combine](#combine)
- [symbol](#symbol)
  - [TypeId (type alias)](#typeid-type-alias)

---

# constructors

## diff

**Signature**

```ts
export declare const diff: <Input, Output>(oldValue: Context<Input>, newValue: Context<Output>) => any
```

Added in v1.0.0

## empty

An empty patch which returns the environment unchanged.

**Signature**

```ts
export declare const empty: <Input = never, Output = never>() => any
```

Added in v1.0.0

# destructors

## patch

Applies a `Patch` to the specified `Context` to produce a new patched
`Context`.

**Signature**

```ts
export declare const patch: <Input>(context: Context<Input>) => <Output>(self: any) => Context<Output>
```

Added in v1.0.0

# model

## ContextPatch (interface)

A `Patch<Input, Output>` describes an update that transforms a `Env<Input>`
to a `Env<Output>` as a data structure. This allows combining updates to
different services in the environment in a compositional way.

**Signature**

```ts
export interface ContextPatch<
```

Added in v1.0.0

# mutations

## combine

Combines two patches to produce a new patch that describes applying the
updates from this patch and then the updates from the specified patch.

**Signature**

```ts
export declare const combine: <Output, Output2>(that: any) => <Input>(self: any) => any
```

Added in v1.0.0

# symbol

## TypeId (type alias)

**Signature**

```ts
export type TypeId = typeof TypeId
```

Added in v1.0.0