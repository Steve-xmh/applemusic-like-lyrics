type Comparator<T> = (a: T, b: T) => number;

/**
 * 优先队列
 * 可以固定设置排序 Callback 方法
 */
export class PQueue<T> extends Array<T> {
  _sorted: boolean = false;

  constructor(
    protected _comparator: Comparator<T> = (a, b) => Number(a) - Number(b)
  ) {
    super();
  }

  sort = (comparator?: Comparator<T>) => {
    this._comparator = comparator ? comparator : this._comparator;
    this._sorted = true;
    return super.sort(this._comparator);
  };

  push = (o: T) => {
    this._sorted = false;
    return super.push(o);
  };

  pop = () => {
    if (!this._sorted) this.sort();
    return super.pop() as T;
  };

  /**
   * 获取下标元素(默认获取最后一位元素)
   * @param index
   * @returns
   */
  peek = (index?: number) => {
    if (!this._sorted) this.sort();
    if (index === undefined) index = this.length - 1;
    return this[index] as T;
  };

  size = () => {
    return this.length;
  };

  debug = () => {
    if (!this._sorted) this.sort();
    return this;
  };
}
