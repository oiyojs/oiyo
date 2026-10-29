export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type RemoveIndexSignature<T> = {
  [K in keyof T as
  string extends K ? never :
    number extends K ? never :
      symbol extends K ? never :
        K
  ]: T[K]
}

export type StrictOmit<T, K extends keyof RemoveIndexSignature<T>> = Prettify<Omit<RemoveIndexSignature<T>, K>>
