import { PQueue } from "./p-queue";
import { Pixel, pv } from "./utils";
import { VBox } from "./v-box";

type VBoxItem = {
  vbox: VBox;
  color: Pixel;
};

export class CMap {
  /**
   * 色彩空间 默认比较函数
   */
  static _compare = (a: VBoxItem, b: VBoxItem) => {
    return pv.naturalOrder(
      a.vbox.count() * a.vbox.volume(),
      b.vbox.count() * b.vbox.volume()
    );
  };
  /**
   * 色彩空间队列，以 CMap._compare 排序
   */
  vboxes: PQueue<VBoxItem>;

  constructor() {
    this.vboxes = new PQueue<VBoxItem>(CMap._compare);
  }

  push = (vbox: VBox) => {
    this.vboxes.push({
      vbox: vbox,
      color: vbox.avg(), // 根据色彩空间平均色取 近似色
    });
  };

  /**
   * 获取所有色彩空间颜色
   * @returns
   */
  palette = () => {
    return this.vboxes.map((vb) => vb.color);
  };

  /**
   * 色彩空间size
   * @returns
   */
  size = () => {
    return this.vboxes.size();
  };

  /**
   * 匹配当前色彩空间近似值
   * @param color
   * @returns
   */
  map = (color: Pixel) => {
    // 当前有色彩空间 包括匹配值
    for (let i = 0; i < this.vboxes.size(); i++) {
      if (this.vboxes.peek(i).vbox.contains(color)) {
        return this.vboxes.peek(i).color;
      }
    }
    // 无匹配，取近似值
    return this.nearest(color);
  };

  /**
   * 获取当前颜色近似值
   * @param color
   * @returns
   */
  nearest = (color: Pixel) => {
    let i, d1, d2, pColor;
    for (i = 0; i < this.vboxes.size(); i++) {
      d2 = Math.sqrt(
        Math.pow(color[0] - this.vboxes.peek(i).color[0], 2) +
          Math.pow(color[1] - this.vboxes.peek(i).color[1], 2) +
          Math.pow(color[2] - this.vboxes.peek(i).color[2], 2)
      );
      if (d1 === undefined || d2 < d1) {
        d1 = d2;
        pColor = this.vboxes.peek(i).color;
      }
    }
    return pColor;
  };

  /**
   * 当色彩空间接近极值时，直接取纯黑白色
   */
  forcebw = () => {
    // 以 rgb 三色空间绝对值排序
    this.vboxes.sort((a: VBoxItem, b: VBoxItem) => {
      return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color));
    });

    // force darkest color to black if everything < 5
    const lowest = this.vboxes[0].color;
    if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
      this.vboxes[0].color = [0, 0, 0];

    // force lightest color to white if everything > 251
    const idx = this.vboxes.length - 1,
      highest = this.vboxes[idx].color;
    if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
      this.vboxes[idx].color = [255, 255, 255];

    this.vboxes.sort(CMap._compare);
  };
}
